#!/usr/bin/env node

/**
 * Script to add an authorized domain to Firebase Authentication
 * Usage: node scripts/add-authorized-domain.js <domain>
 */

const { execSync } = require('child_process');

const domain = process.argv[2];

if (!domain) {
  console.error('Usage: node scripts/add-authorized-domain.js <domain>');
  process.exit(1);
}

console.log(`Adding authorized domain: ${domain}`);

try {
  // Get access token
  const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();
  
  // Get current config
  const projectId = 'joydrops-2426b';
  const getUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  
  console.log('Fetching current configuration...');
  const getResponse = execSync(
    `curl -s -X GET "${getUrl}" -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json"`,
    { encoding: 'utf-8' }
  );
  
  const config = JSON.parse(getResponse);
  
  if (config.error) {
    console.error('Error fetching config:', config.error.message);
    console.error('\nTrying alternative method...');
    
    // Alternative: Use Firebase Management API
    console.log('\nPlease add the domain manually via Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com/project/joydrops-2426b/authentication/settings');
    console.log('2. Scroll to "Authorized domains"');
    console.log(`3. Click "Add domain" and enter: ${domain}`);
    process.exit(1);
  }
  
  // Check if domain already exists
  const authorizedDomains = config.authorizedDomains || [];
  if (authorizedDomains.includes(domain)) {
    console.log(`✓ Domain ${domain} is already authorized`);
    process.exit(0);
  }
  
  // Add the new domain
  authorizedDomains.push(domain);
  
  // Update config
  const updateUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`;
  const updateBody = JSON.stringify({
    authorizedDomains: authorizedDomains
  });
  
  console.log('Updating configuration...');
  const updateResponse = execSync(
    `curl -s -X PATCH "${updateUrl}" -H "Authorization: Bearer ${accessToken}" -H "Content-Type: application/json" -d '${updateBody}'`,
    { encoding: 'utf-8' }
  );
  
  const result = JSON.parse(updateResponse);
  
  if (result.error) {
    console.error('Error updating config:', result.error.message);
    console.error('\nPlease add the domain manually via Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com/project/joydrops-2426b/authentication/settings');
    console.log('2. Scroll to "Authorized domains"');
    console.log(`3. Click "Add domain" and enter: ${domain}`);
    process.exit(1);
  }
  
  console.log(`✓ Successfully added ${domain} to authorized domains`);
  console.log('Authorized domains:', result.authorizedDomains?.join(', ') || 'N/A');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('\nPlease add the domain manually via Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com/project/joydrops-2426b/authentication/settings');
  console.log('2. Scroll to "Authorized domains"');
  console.log(`3. Click "Add domain" and enter: ${domain}`);
  process.exit(1);
}
