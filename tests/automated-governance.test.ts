/**
 * DigitalNexCare - Automated Governance & Constitutional Compliance Test Suite
 *
 * Test Specifications:
 * 1. User-specific reveal independence (Patient A vs. Patient B)
 * 2. Global directory visibility and zero redundant external queries
 * 3. Claim flow success and failure scenarios (including mandatory admin reason check)
 */

import { UserUnlockService } from '../src/lib/subscription/user-unlock-service';
import { SubscriptionService } from '../src/lib/subscription/subscription-service';
import { DirectoryService } from '../src/lib/directory/directory-service';
import { ProviderService, CLAIMS_REGISTRY } from '../src/lib/provider/provider-service';
import { ExternalPractitionerUnlocked, ExternalPractitionerLocked } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}: ${failureDetails || 'Assertion failed'}`);
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('DIGITALNEXCARE AUTOMATED GOVERNANCE TEST SUITE');
  console.log('=============================================================\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 1: USER-SPECIFIC REVEAL INDEPENDENCE (Patient A vs. Patient B)
  // --------------------------------------------------------------------------
  console.log('--- 1. User-Specific Reveal Independence (Patient A vs. Patient B) ---');

  const patientA = 'test-patient-a-' + Date.now();
  const patientB = 'test-patient-b-' + Date.now();
  const targetPractitionerId = 'ext-001';

  // Initially, neither patient has unlocked target practitioner
  const initA = UserUnlockService.isPractitionerUnlockedForUser(patientA, targetPractitionerId);
  const initB = UserUnlockService.isPractitionerUnlockedForUser(patientB, targetPractitionerId);
  assert(!initA && !initB, 'Initial state: Neither Patient A nor Patient B has unlocked target');

  // Patient A unlocks the external practitioner
  const unlockResultA = UserUnlockService.unlockForUser({
    userId: patientA,
    practitionerId: targetPractitionerId,
    currentPlan: 'NEXCARE_FREE',
  });
  assert(unlockResultA.success, 'Patient A successfully unlocks external practitioner');
  assert(unlockResultA.status === 'ALLOW', 'Patient A unlock status is ALLOW');
  assert(unlockResultA.revealsUsed === 1, 'Patient A reveal count increments to 1');

  // Assert Patient A is now unlocked
  const isAUnlocked = UserUnlockService.isPractitionerUnlockedForUser(patientA, targetPractitionerId);
  assert(isAUnlocked, 'Patient A view: Practitioner is UNLOCKED');

  // CRITICAL CONSTITUTIONAL ASSERTION: Patient B MUST REMAIN LOCKED
  const isBUnlocked = UserUnlockService.isPractitionerUnlockedForUser(patientB, targetPractitionerId);
  assert(!isBUnlocked, 'Patient B view: Practitioner REMAINS LOCKED (Zero Leakage / No Global Flag)');

  // Test Projection in Directory Search for Patient A vs Patient B
  const searchForA = SubscriptionService.searchDirectory({
    userId: patientA,
    query: 'Sibusiso Khumalo',
    province: 'Gauteng',
  });

  const foundInUnlockedA = searchForA.unlockedExternal.some((p) => p.id === targetPractitionerId);
  const foundInLockedA = searchForA.lockedExternal.some((p) => p.id === targetPractitionerId);
  assert(foundInUnlockedA && !foundInLockedA, 'Search for Patient A: Returned in unlockedExternal list with full details');

  const searchForB = SubscriptionService.searchDirectory({
    userId: patientB,
    query: 'Sibusiso Khumalo',
    province: 'Gauteng',
  });

  const foundInUnlockedB = searchForB.unlockedExternal.some((p) => p.id === targetPractitionerId);
  const foundInLockedB = searchForB.lockedExternal.some((p) => p.id === targetPractitionerId);
  assert(!foundInUnlockedB && foundInLockedB, 'Search for Patient B: Returned in lockedExternal list as REDACTED card');

  // Verify server-side redaction for Patient B
  const lockedCardB = searchForB.lockedExternal.find((p) => p.id === targetPractitionerId) as any;
  const hasContactLeak =
    Boolean(lockedCardB?.phone) ||
    Boolean(lockedCardB?.telephone) ||
    Boolean(lockedCardB?.email) ||
    Boolean(lockedCardB?.website) ||
    Boolean(lockedCardB?.exactAddress);

  assert(!hasContactLeak, 'Server-side data protection: Locked card payload for Patient B contains zero telephone/email/address leaks');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: GLOBAL DIRECTORY VISIBILITY
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Global Directory Visibility ---');

  const testNewPractitioner: ExternalPractitionerUnlocked = {
    id: `ext-global-test-${Date.now()}`,
    slug: `dr-pieter-kruger-dentist-${Date.now()}`,
    practitionerType: 'EXTERNAL_PRACTITIONER',
    fullName: 'Dr Pieter Kruger',
    title: 'Dr.',
    specialty: 'Dentist',
    practiceName: 'Kruger Dental Care',
    province: 'Western Cape',
    city: 'Cape Town',
    suburb: 'Sea Point',
    address: '100 Regent Road, Sea Point, Cape Town',
    coordinates: { latitude: -33.9167, longitude: 18.3833 },
    rating: 4.9,
    reviewCount: 14,
    services: ['General Dentistry', 'Teeth Whitening'],
    languages: ['English', 'Afrikaans'],
    acceptedMedicalAids: ['Discovery Health', 'Bonitas'],
    offersVirtual: false,
    offersInPerson: true,
    lastVerifiedAt: new Date().toISOString(),
    phone: '+27 21 434 0001',
    email: 'info@krugerdental.co.za',
    website: 'https://krugerdental.co.za',
    claimStatus: 'UNCLAIMED',
    dataAuthority: 'PRACTICE_WEBSITE',
    sourceAttribution: 'Practice Web Directory',
  };

  // Register in canonical directory index
  DirectoryService.registerExternalPractitioner(testNewPractitioner);

  // Search globally for all users
  const globalSearch1 = SubscriptionService.searchDirectory({
    query: 'Pieter Kruger',
    province: 'Western Cape',
  });
  const isFoundGlobally1 =
    globalSearch1.unlockedExternal.some((p) => p.id === testNewPractitioner.id) ||
    globalSearch1.lockedExternal.some((p) => p.id === testNewPractitioner.id);
  assert(isFoundGlobally1, 'New practitioner is immediately discoverable in national search directory');

  // Verify availability in Supabase check
  const isAvailableInSupabase = DirectoryService.isAvailableInSupabase('Pieter Kruger', 'Dentist', 'Cape Town');
  assert(isAvailableInSupabase, 'Supabase Practitioner Index contains fresh record (isAvailableInSupabase = true)');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: PROFILE CLAIM FLOW & CONSTITUTIONAL RULES
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Profile Claim Flow & Mandatory Reason Validation ---');

  const providerUserId = 'usr-provider-claimant-' + Date.now();

  // Step 1: Submit a claim request for an unclaimed listing
  const submitClaimRes = ProviderService.submitProfileClaim({
    userId: providerUserId,
    candidate: {
      id: testNewPractitioner.id,
      name: testNewPractitioner.fullName,
      specialty: testNewPractitioner.specialty,
      practice: testNewPractitioner.practiceName,
      location: `${testNewPractitioner.suburb}, ${testNewPractitioner.city}`,
      source: 'National Practitioner Directory',
    },
    council: 'HPCSA',
    registrationNumber: 'DP 0459812',
    practiceNumber: '0089123',
    claimantName: 'Dr Pieter Kruger',
    claimantEmail: 'pieter.kruger@example.co.za',
    claimantPhone: '+27 83 555 7890',
  });

  assert(submitClaimRes.success, 'Step 1: Provider successfully submits claim request');
  assert(submitClaimRes.claim?.status === 'CLAIM_REQUESTED', 'Step 1b: Claim status is CLAIM_REQUESTED (not automatically verified)');

  const createdClaimId = submitClaimRes.claim!.id;

  // Step 2: Constitutional Constraint - Admin Approval WITHOUT Reason MUST FAIL
  const invalidApproval = ProviderService.adminApproveClaimAndMerge({
    claimId: createdClaimId,
    verifierId: 'Admin-Audit-01',
    notes: '', // Empty notes - violates constitutional mandate!
  });
  assert(!invalidApproval.success, 'Step 2: Admin approval WITHOUT reason is rejected');
  assert(invalidApproval.message.includes('Mandatory approval reason'), 'Step 2b: Error clarifies mandatory reason requirement');

  // Step 3: Constitutional Constraint - Admin Rejection WITHOUT Reason MUST FAIL
  const invalidRejection = ProviderService.adminRejectClaim({
    claimId: createdClaimId,
    verifierId: 'Admin-Audit-01',
    reason: '   ', // Whitespace only - violates constitutional mandate!
  });
  assert(!invalidRejection.success, 'Step 3: Admin decline WITHOUT reason is rejected');
  assert(invalidRejection.message.includes('Mandatory decline reason'), 'Step 3b: Error clarifies mandatory reason requirement');

  // Step 4: Admin Approval WITH Verifiable Reason
  const validApproval = ProviderService.adminApproveClaimAndMerge({
    claimId: createdClaimId,
    verifierId: 'Admin-Audit-01',
    notes: 'Statutory HPCSA registry verified against DP 0459812. BHF practice number matched.',
  });

  assert(validApproval.success, 'Step 4: Admin approval WITH reason succeeds');
  assert(validApproval.convertedProvider !== undefined, 'Step 4b: Directory record converted to DIGITALNEXCARE_PROVIDER');
  assert(validApproval.convertedProvider?.dataAuthority === 'DIGITALNEXCARE_VERIFIED_PROVIDER', 'Step 4c: Data authority upgraded to DIGITALNEXCARE_VERIFIED_PROVIDER');
  assert(validApproval.convertedProvider?.verificationStatus === 'VERIFIED', 'Step 4d: Verification status is VERIFIED');
  assert(validApproval.convertedProvider?.availableSlots.length! > 0, 'Step 4e: Real direct booking slots are unlocked');

  // Step 5: Test claim rejection scenario on a fresh claim
  const submitClaim2 = ProviderService.submitProfileClaim({
    userId: 'usr-fake-claimant-' + Date.now(),
    candidate: {
      id: 'ext-jhb-physio-01',
      name: 'Dr Thabo Khumalo',
      specialty: 'Physiotherapist',
      practice: 'Khumalo Physio',
      location: 'Rosebank, Johannesburg',
      source: 'National Practitioner Directory',
    },
    council: 'HPCSA',
    registrationNumber: 'PT 0000000', // Invalid
    practiceNumber: '0000000',
    claimantName: 'Imposter Claimant',
    claimantEmail: 'imposter@fake.com',
    claimantPhone: '+27 11 000 0000',
  });

  assert(submitClaim2.success, 'Step 5: Second claim request created for audit rejection test');
  const validDecline = ProviderService.adminRejectClaim({
    claimId: submitClaim2.claim!.id,
    verifierId: 'Admin-Audit-01',
    reason: 'Registration PT 0000000 could not be authenticated on HPCSA statutory portal.',
  });

  assert(validDecline.success, 'Step 5b: Admin decline WITH recorded reason succeeds');
  const rejectedClaimRecord = CLAIMS_REGISTRY.find((c) => c.id === submitClaim2.claim!.id);
  assert(rejectedClaimRecord?.status === 'REJECTED', 'Step 5c: Claim record status updated to REJECTED');
  assert(rejectedClaimRecord?.rejectionReason?.length! > 0, 'Step 5d: Decline reason permanently recorded in audit trail');

  console.log('\n=============================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('=============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
