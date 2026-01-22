import { Timestamp } from 'firebase/firestore';

export type UserType = 'individual' | 'organization';

export interface UserProfile {
    uid: string;
    email: string;
    userType: UserType;
    slug: string;
    passwordStatus: 'temporary' | 'changed_by_user'; // mapped from backend 'password' field logic
    createdAt: Timestamp;

    // TIER 1: Individual Count
    joydropCount?: number;

    // Individual Fields
    name?: string;
    address?: string;
    city?: string;
    stateProvince?: string;
    country?: string;
    contactNumber?: string;
    contactEmail?: string;
    organizationId?: string;
    organizationSlug?: string;
    organizationName?: string;
    consentToJoinOrg?: boolean;

    // Organization Fields
    orgName?: string;
    orgType?: string;
    orgAddress?: string;
    orgCity?: string;
    orgStateProvince?: string;
    orgCountry?: string;
    orgContactPerson?: string;
    orgContactNumber?: string;
    orgContactEmail?: string;
    orgSize?: string;

    // TIER 2: Organization Count & Members
    orgJoydropCount?: number;
    memberCount?: number;
}

export interface Joydrop {
    id: string;
    userId: string;
    userName: string;
    organizationId?: string;
    organizationName?: string;
    timestamp: Timestamp;
    date: string;
    time: string;
    city?: string;
    stateProvince?: string;
    country?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    url?: string;
    comment?: string;
    createdAt: Timestamp;
}

export interface OrganizationMember {
    id: string;
    organizationId: string;
    organizationSlug: string;
    individualId: string;
    individualSlug: string;
    individualName: string;
    joinedAt: Timestamp;
}
