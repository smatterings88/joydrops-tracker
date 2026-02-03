import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// --- GoHighLevel / DailyHug integration config ---
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_KEY = process.env.GHL_API_KEY;

const DAILYHUG_API_BASE = 'https://go.dailyhug.com';
const DAILYHUG_API_URL = `${DAILYHUG_API_BASE}/api/url/add`;
const DAILYHUG_API_KEY = process.env.DAILYHUG_API_KEY;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            orgName,
            slug,
            // Community Identity
            orgType,
            orgWebsite,
            // Location
            orgCity,
            orgCountry,
            // Primary Contact
            contactFirstName,
            contactLastName,
            contactRole,
            // Scale & Impact
            orgSize,
            featuredPublicly,
            beneficiary,
            // Referrals
            referrals,
            // Legacy fields (for backward compatibility)
            orgAddress,
            orgStateProvince,
            orgContactPerson,
            orgContactNumber,
            orgContactEmail,
        } = body;

        if (!email || !password || !orgName) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Auto-generate slug from orgName if not provided
        let normalizedSlug = slug?.toLowerCase() || orgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 30);
        
        // Ensure slug is not empty
        if (!normalizedSlug) {
            normalizedSlug = `org-${Date.now()}`;
        }
        const normalizedOrgName = orgName.trim();

        // Check slug
        const slugRef = adminDb.collection('slugs').doc(normalizedSlug);
        const slugDoc = await slugRef.get();
        if (slugDoc.exists) {
            return NextResponse.json({ success: false, message: 'Slug already taken' }, { status: 409 });
        }

        // Check for duplicate organization name (case-insensitive)
        // Fetch all organizations and check names in memory since Firestore doesn't support case-insensitive queries
        const orgsSnapshot = await adminDb.collection('user_profiles')
            .where('userType', '==', 'organization')
            .get();

        const existingOrgNames = orgsSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.orgName?.trim().toLowerCase() || '';
        });

        const normalizedOrgNameLower = normalizedOrgName.toLowerCase();
        if (existingOrgNames.includes(normalizedOrgNameLower)) {
            return NextResponse.json({ 
                success: false, 
                message: 'An organization with this name already exists. Please choose a different name.' 
            }, { status: 409 });
        }

        // Create Auth User
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: orgName,
        });

        const uid = userRecord.uid;
        const batch = adminDb.batch();

        // Create Org Profile
        const userProfileRef = adminDb.collection('user_profiles').doc(uid);
        const orgData = {
            uid,
            email,
            userType: 'organization',
            slug: normalizedSlug,
            password: 'temporary',
            createdAt: FieldValue.serverTimestamp(),

            // Organization fields
            orgName: normalizedOrgName, // Store normalized (trimmed) name
            orgType: orgType || null,
            orgWebsite: orgWebsite || null,
            orgAddress: orgAddress || null,
            orgCity: orgCity || null,
            orgStateProvince: orgStateProvince || null,
            orgCountry: orgCountry || null,
            
            // Primary Contact (new fields)
            contactFirstName: contactFirstName || null,
            contactLastName: contactLastName || null,
            contactRole: contactRole || null,
            // Legacy contact fields (for backward compatibility)
            orgContactPerson: orgContactPerson || contactFirstName && contactLastName 
                ? `${contactFirstName} ${contactLastName}`.trim() 
                : null,
            orgContactNumber: orgContactNumber || null,
            orgContactEmail: orgContactEmail || email || null,
            
            // Scale & Impact
            orgSize: orgSize || null,
            featuredPublicly: featuredPublicly || null,
            beneficiary: beneficiary || null,
            
            // Referrals
            referrals: referrals || null,

            // Metrics
            orgJoydropCount: 0, // TIER 2 initialized to 0
            memberCount: 0,
        };

        batch.set(userProfileRef, orgData);

        // Reserve Slug
        batch.set(slugRef, {
            slug: normalizedSlug,
            userId: uid,
            userType: 'organization',
            createdAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        // After successful org creation, integrate with GoHighLevel / DailyHug.
        // This is best-effort: failures here should not block org creation.
        try {
            await handleGHLIntegration({
                email,
                slug: normalizedSlug,
            });
        } catch (integrationError) {
            console.error('GHL/DailyHug integration failed:', integrationError);
        }

        return NextResponse.json({
            success: true,
            uid,
            slug: normalizedSlug,
            message: 'Organization created successfully',
        });

    } catch (error: any) {
        console.error('Error creating organization:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Internal server error'
        }, { status: 500 });
    }
}

// -------------------------
// GoHighLevel integration
// -------------------------

type GHLContact = {
    id: string;
    email?: string;
    customField?: Array<{ id?: string; value?: string }>;
    customFields?: Record<string, any>;
};

type GHLFieldDefinition = {
    id: string;
    fieldKey: string;
};

type FieldMap = Record<string, string>;

async function fetchGHLContactByEmail(email: string): Promise<GHLContact | null> {
    if (!GHL_API_KEY) {
        console.warn('GHL_API_KEY is not configured; skipping GHL contact lookup.');
        return null;
    }

    const url = `${GHL_API_BASE}/contacts/?query=${encodeURIComponent(email)}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            Version: '2021-07-28',
        },
    });

    if (!response.ok) {
        console.error('Failed to fetch GHL contact by email:', response.status, response.statusText);
        return null;
    }

    const data: any = await response.json();

    let contacts: GHLContact[] = [];
    if (Array.isArray(data?.contacts)) {
        contacts = data.contacts;
    } else if (data?.contact) {
        contacts = [data.contact];
    } else if (Array.isArray(data)) {
        contacts = data;
    }

    if (!contacts.length) return null;

    const exact = contacts.find(
        (c) => c.email && c.email.toLowerCase() === email.toLowerCase()
    );
    return exact || contacts[0];
}

async function fetchGHLFieldDefinitions(): Promise<FieldMap> {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
        console.warn('GHL_API_KEY or GHL_LOCATION_ID is not configured; skipping GHL field definitions.');
        return {};
    }

    const url = `${GHL_API_BASE}/custom-fields/?locationId=${encodeURIComponent(
        GHL_LOCATION_ID
    )}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        console.error(
            'Failed to fetch GHL custom field definitions:',
            response.status,
            response.statusText
        );
        return {};
    }

    const data: any = await response.json();
    const fieldMap: FieldMap = {};

    if (Array.isArray(data?.customFields)) {
        (data.customFields as GHLFieldDefinition[]).forEach((field) => {
            if (field.id && field.fieldKey) {
                const normalizedKey = field.fieldKey.startsWith('contact.')
                    ? field.fieldKey.substring(8)
                    : field.fieldKey;
                fieldMap[field.id] = normalizedKey;
            }
        });
    }

    return fieldMap;
}

function getCustomFieldValueFromContact(
    contact: GHLContact,
    fieldName: string,
    fieldDefinitions: FieldMap
): string | null {
    // Method 1: check customField array using field definitions
    if (contact.customField && Array.isArray(contact.customField)) {
        for (const field of contact.customField) {
            if (!field?.id) continue;
            if (fieldDefinitions[field.id] === fieldName) {
                const value =
                    (field as any).value ??
                    (field as any).field_value ??
                    (field as any).fieldValue ??
                    '';
                return value || null;
            }
        }
    }

    // Method 2: check customFields object directly by key
    if (contact.customFields && fieldName in contact.customFields) {
        const raw = contact.customFields[fieldName];
        return (raw ?? '').toString() || null;
    }

    return null;
}

async function updateGHLContactCustomField(
    contactId: string,
    fieldName: string,
    value: string,
    fieldDefinitions: FieldMap
): Promise<void> {
    if (!GHL_API_KEY) {
        console.warn('GHL_API_KEY is not configured; skipping GHL contact update.');
        return;
    }

    // Find field ID by name
    let customFieldId: string | null = null;
    for (const [id, key] of Object.entries(fieldDefinitions)) {
        if (key === fieldName) {
            customFieldId = id;
            break;
        }
    }

    if (!customFieldId) {
        console.warn(`GHL custom field "${fieldName}" not found; skipping update.`);
        return;
    }

    const url = `${GHL_API_BASE}/contacts/${encodeURIComponent(contactId)}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            customField: [
                {
                    id: customFieldId,
                    value,
                },
            ],
        }),
    });

    if (!response.ok) {
        console.error(
            `Failed to update GHL contact ${contactId} field ${fieldName}:`,
            response.status,
            response.statusText
        );
    }
}

async function createDailyHugUrl(userAffID: string, slug: string): Promise<string | null> {
    if (!DAILYHUG_API_KEY) {
        console.warn('DAILYHUG_API_KEY is not configured; skipping DailyHug call.');
        return null;
    }

    const body = {
        url: userAffID,
        custom: slug,
        type: 'direct',
    };

    const response = await fetch(DAILYHUG_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${DAILYHUG_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.error(
            'Failed to call DailyHug URL API:',
            response.status,
            response.statusText
        );
        return null;
    }

    // Per spec, the short link will be https://go.dailyhug.com/{slug}
    return `${DAILYHUG_API_BASE}/${slug}`;
}

async function handleGHLIntegration(params: { email: string; slug: string }) {
    const { email, slug } = params;

    // 1. Find the GHL contact by primary contact email
    const contact = await fetchGHLContactByEmail(email);
    if (!contact) {
        console.warn('No GHL contact found for email; skipping GHL integration:', email);
        return;
    }

    // 2. Get field definitions
    const fieldDefinitions = await fetchGHLFieldDefinitions();
    if (!Object.keys(fieldDefinitions).length) {
        console.warn('No GHL field definitions returned; skipping custom field operations.');
        return;
    }

    // 3. Read affiliate_link_full into userAffID
    const userAffID =
        getCustomFieldValueFromContact(contact, 'affiliate_link_full', fieldDefinitions) ||
        '';

    if (!userAffID) {
        console.warn(
            'affiliate_link_full custom field is empty or missing; skipping DailyHug + connector_short_link.'
        );
        return;
    }

    // 4. Call DailyHug URL API to register the URL
    const shortUrl = await createDailyHugUrl(userAffID, slug);
    if (!shortUrl) {
        return;
    }

    // 5. Save https://go.dailyhug.com/{slug} into connector_short_link custom field
    await updateGHLContactCustomField(
        contact.id,
        'connector_short_link',
        shortUrl,
        fieldDefinitions
    );
}

