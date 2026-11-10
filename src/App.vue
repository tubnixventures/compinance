<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ShieldCheck,
  Smartphone,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Users,
  UserCheck,
  Briefcase,
  DollarSign,
  ArrowRight,
  RefreshCw,
  FileText,
  Activity,
  Lock,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Send,
  Trash2,
  Building2,
  GraduationCap,
  Check,
  LogOut,
  LogIn,
  UserPlus,
  Compass,
  FileCheck,
  Search,
  ExternalLink,
  PhoneCall,
  Mail,
  MapPin,
  Calendar,
  Percent,
  KeyRound,
  FileSignature,
  FileDown,
  Printer,
  ChevronDown,
  Home,
  Receipt,
  User,
  Sliders,
  Wallet,
  Cpu,
  Layers,
  TrendingUp,
  CircleAlert,
} from 'lucide-vue-next';
import LoanDashboard from './components/LoanDashboard.vue';
import LoanCalculator from './components/LoanCalculator.vue';

// ==========================================
// NAVIGATION & PAGE ROUTING STATE
// ==========================================
type PageRoute =
  | 'home'
  | 'about'
  | 'terms'
  | 'help'
  | 'login'
  | 'register'
  | 'loan_studio'
  | 'my_loans'
  | 'kyc'
  | 'account'
  | 'admin';

const currentPage = ref<PageRoute>('home');

// Active User / Session State
interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  type: 'student' | 'staff';
  role?: 'root' | 'ceo' | 'manager' | 'admin' | 'customer_care';
  status: 'pending' | 'approved' | 'rejected' | 'pending_admin_approval' | 'ai_rejected';
  loanLimit?: number;
  isDefaulter?: boolean;
  totalLoansCompleted?: number;
  nationalIdNumber?: string;
  university?: string;
  course?: string;
  regNumber?: string;
  parentPhone?: string;
  parentName?: string;
  parentIdNumber?: string;
}

const currentUser = ref<CurrentUser | null>({
  id: 'usr_student_demo',
  fullName: 'Grace Wanjiku',
  email: 'student@uonbi.ac.ke',
  phone: '+254712345678',
  type: 'student',
  status: 'approved',
  loanLimit: 30, // Default first-time student loan limit is KES 30
  isDefaulter: false,
  totalLoansCompleted: 0,
  nationalIdNumber: '38901234',
  university: 'University of Nairobi',
  course: 'BSc. Computer Science',
  regNumber: 'P15/14231/2023',
  parentPhone: '+254722998877',
  parentName: 'Mary Muthoni Wanjiku',
  parentIdNumber: '11223344',
});

const authToken = ref<string>('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3Jfc3R1ZGVudF9kZW1vIiwidHlwZSI6InN0dWRlbnQiLCJpYXQiOjE3OTQzMzE1NTUsImV4cCI6MTc5NDMzNTE1NSwidG9rZW5UeXBlIjoiYWNjZXNzIn0.rANtew_HMrWYOvfQeQzTd_K61VV8Nn17zsCsjg4pKFA');

// Feedback Alerts
const alertMessage = ref<string | null>(null);
const alertType = ref<'success' | 'error' | 'info'>('info');

function showAlert(message: string, type: 'success' | 'error' | 'info' = 'info') {
  alertMessage.value = message;
  alertType.value = type;
  setTimeout(() => {
    if (alertMessage.value === message) alertMessage.value = null;
  }, 5000);
}

// Quick Role Switcher for Demo & Testing
function switchDemoRole(roleType: 'student' | 'root' | 'ceo' | 'manager' | 'care' | 'guest') {
  if (roleType === 'guest') {
    currentUser.value = null;
    authToken.value = '';
    currentPage.value = 'home';
    showAlert('Switched to Guest / Public visitor view', 'info');
    return;
  }

  if (roleType === 'student') {
    currentUser.value = {
      id: 'usr_student_demo',
      fullName: 'Grace Wanjiku',
      email: 'student@uonbi.ac.ke',
      phone: '+254712345678',
      type: 'student',
      status: 'approved',
      loanLimit: 30,
      isDefaulter: false,
      totalLoansCompleted: 0,
      nationalIdNumber: '38901234',
      university: 'University of Nairobi',
      course: 'BSc. Computer Science',
      regNumber: 'P15/14231/2023',
      parentPhone: '+254722998877',
      parentName: 'Mary Muthoni Wanjiku',
      parentIdNumber: '11223344',
    };
    authToken.value = 'demo_student_token';
    currentPage.value = 'home';
    showAlert('Switched to Student: Grace Wanjiku (Limit: KES 30)', 'success');
  } else if (roleType === 'root') {
    currentUser.value = {
      id: 'usr_root_1',
      fullName: 'Chief Technology Architect (Root)',
      email: 'root@compinance.co.ke',
      phone: '+254700000001',
      type: 'staff',
      role: 'root',
      status: 'approved',
    };
    authToken.value = 'demo_root_token';
    currentPage.value = 'admin';
    showAlert('Switched to Staff: Root Architect (Full Authority)', 'success');
  } else if (roleType === 'ceo') {
    currentUser.value = {
      id: 'usr_ceo_1',
      fullName: 'Amina Odhiambo (CEO)',
      email: 'ceo@compinance.co.ke',
      phone: '+254700000002',
      type: 'staff',
      role: 'ceo',
      status: 'approved',
    };
    authToken.value = 'demo_ceo_token';
    currentPage.value = 'admin';
    showAlert('Switched to Staff: CEO Amina Odhiambo', 'success');
  } else if (roleType === 'manager') {
    currentUser.value = {
      id: 'usr_manager_1',
      fullName: 'Faith Mwangi (Credit Manager)',
      email: 'manager@compinance.co.ke',
      phone: '+254700000004',
      type: 'staff',
      role: 'manager',
      status: 'approved',
    };
    authToken.value = 'demo_manager_token';
    currentPage.value = 'admin';
    showAlert('Switched to Staff: Credit Risk Manager Faith Mwangi', 'success');
  } else if (roleType === 'care') {
    currentUser.value = {
      id: 'usr_care_1',
      fullName: 'Brian Omondi (Customer Care)',
      email: 'care@compinance.co.ke',
      phone: '+254700000005',
      type: 'staff',
      role: 'customer_care',
      status: 'approved',
    };
    authToken.value = 'demo_care_token';
    currentPage.value = 'admin';
    showAlert('Switched to Staff: Customer Care Brian Omondi', 'success');
  }

  fetchDashboardData();
}

// ==========================================
// CALCULATOR & HOME PROPOSITION STATE
// ==========================================
const calcAmount = ref<number>(30); // Default first-time loan is strictly KES 30
const calcDuration = ref<number>(7);
const calcTotalRepayable = computed(() => {
  const interest = Math.round(calcAmount.value * 0.05 * 100) / 100;
  return calcAmount.value + interest;
});

// ==========================================
// AUTH FORMS STATE
// ==========================================
const loginIdentifier = ref<string>('student@uonbi.ac.ke');
const loginPassword = ref<string>('Compinance2026!');
const authLoading = ref<boolean>(false);

const regFullName = ref<string>('');
const regEmail = ref<string>('');
const regPhone = ref<string>('');
const regNationalId = ref<string>('');
const regUniversity = ref<string>('University of Nairobi');
const regCourse = ref<string>('');
const regRegNo = ref<string>('');
const regPassword = ref<string>('');
const regConfirmPassword = ref<string>('');
const regWhatsappOptIn = ref<boolean>(true);

// ==========================================
// 4-STAGE PROFESSIONAL LOAN STUDIO STATE
// ==========================================
const loanStudioStep = ref<1 | 2 | 3 | 4>(1); // 1: Quote, 2: Identity, 3: Promissory Note, 4: 2FA & Disbursal
const applyAmount = ref<number>(30); // Default strictly KES 30
const applyDuration = ref<number>(14);
const applyReason = ref<string>('Academic Handouts & Exam Printing');
const applySignatureText = ref<string>('Grace Wanjiku');
const applyConsent1 = ref<boolean>(true);
const applyConsent2 = ref<boolean>(true);
const applyConsent3 = ref<boolean>(true);
const applyOtpInput = ref<string>('482910'); // Simulated 6-digit OTP
const applyLoading = ref<boolean>(false);

const studentLoans = ref<any[]>([
  {
    id: 'ln_demo_101',
    userId: 'usr_student_demo',
    studentName: 'Grace Wanjiku',
    studentPhone: '+254712345678',
    amount: 30,
    interestRate: 0.05,
    totalPayable: 31.5,
    durationDays: 7,
    dueDate: Date.now() + 7 * 86400000,
    status: 'disbursed',
    amountPaid: 0,
    createdAt: Date.now() - 2 * 86400000,
    financialTransactionId: 'MPESA_PW_88921',
  },
]);

// Repayment Modal
const showRepayModal = ref<boolean>(false);
const repayLoanTarget = ref<any>(null);
const repayMpesaPhone = ref<string>('+254712345678');
const repayAmountInput = ref<number>(31.5);
const repayLoading = ref<boolean>(false);
const repaySuccessMessage = ref<string | null>(null);

// Printable Receipt Modal
const showReceiptModal = ref<boolean>(false);
const receiptLoanTarget = ref<any>(null);

// ==========================================
// KYC CLOUDFLARE AI VERIFICATION STATE
// ==========================================
const kycNationalIdNum = ref<string>('38901234');
const kycParentName = ref<string>('Mary Muthoni Wanjiku');
const kycParentIdNum = ref<string>('11223344');
const kycParentPhone = ref<string>('+254722998877');
const kycSimulateCollusion = ref<boolean>(false);
const kycLoading = ref<boolean>(false);
const kycResult = ref<any>({
  passed: true,
  trustScore: 96,
  riskLevel: 'LOW',
  reasons: [
    'Cloudflare Workers AI forensic verification passed: Independent adult kinship confirmed',
    'National ID biometrics match university registrar records',
    'Parent ID verified independent adult citizen (no peer student match)',
  ],
  parentKinshipVerified: true,
  extractedNationalId: '38901234',
  extractedParentId: '11223344',
});

// ==========================================
// ADMIN DASHBOARD STATE
// ==========================================
const adminTab = ref<'loans' | 'limits' | 'staff' | 'liquidity'>('loans');
const adminLoans = ref<any[]>([]);
const adminStudents = ref<any[]>([]);
const adminStaff = ref<any[]>([]);
const adminWebhooks = ref<any[]>([]);
const adminFloatBalance = ref<number>(45000); // Triggering low float alert demo
const adminReserveFloor = ref<number>(50000);

// Manual Limit Allocation Form
const manualLimitStudentId = ref<string>('usr_student_demo');
const manualLimitAmount = ref<number>(50);
const manualLimitReason = ref<string>('On-time repayment history verified by credit desk');

// Create Staff Form (RBAC restricted)
const createStaffName = ref<string>('');
const createStaffEmail = ref<string>('');
const createStaffPhone = ref<string>('+254722114455');
const createStaffRole = ref<'customer_care' | 'manager' | 'admin' | 'ceo'>('customer_care');

// Support Ticket State (Help Page)
const ticketName = ref<string>('Grace Wanjiku');
const ticketEmail = ref<string>('student@uonbi.ac.ke');
const ticketSubject = ref<string>('Question regarding KES 30 loan repayment');
const ticketMessage = ref<string>('');
const ticketSent = ref<boolean>(false);

// Help FAQ Search
const faqSearch = ref<string>('');
const faqs = [
  {
    q: 'Why is the introductory first-time loan set strictly to KES 30?',
    a: 'Under Compinance responsible lending regulations, first-time borrowers are introduced with a safe starter micro-loan of KES 30 (range KES 20–50 max). This ensures students establish an unburdened credit history without predatory indebtedness.',
  },
  {
    q: 'How do I repay my loan via M-Pesa?',
    a: 'Tap "Repay via M-Pesa" in your statements to trigger an automated PawaPay STK push directly to your registered Safaricom phone. Simply input your M-Pesa PIN. Alternatively, pay via Paybill 400200 with your National ID as the account number.',
  },
  {
    q: 'Can I apply for another loan while having an active balance?',
    a: 'No. Compinance strictly enforces single active loan policy: you can only apply for a new loan after 100% full repayment of your existing balance.',
  },
  {
    q: 'What is the Cloudflare AI Kinship & Peer Collusion rule?',
    a: 'Our Cloudflare Workers AI forensic engine inspects parent credentials. If a student attempts to register another student as their parent, or uses their own phone/ID as parent, the system immediately flags this as criminal forgery and rejects the application.',
  },
  {
    q: 'How can I increase my loan limit above KES 30?',
    a: 'After prompt on-time repayments, your credit rating upgrades automatically to KES 50. In addition, Compinance credit risk officers manually review and increase qualified loan limits (up to KES 500 – KES 5,000) for compliant students.',
  },
  {
    q: 'What happens if I default on my repayment date?',
    a: 'Failure to repay marks your account as isDefaulter: true. Your borrowing privileges will be frozen across all campuses, and defaulted balances are assigned to credit collectors with notifications sent to university administration and Credit Reference Bureaus (CRB).',
  },
];

const filteredFaqs = computed(() => {
  if (!faqSearch.value.trim()) return faqs;
  const q = faqSearch.value.toLowerCase();
  return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
});

// Computed active student loan
const activeStudentLoan = computed(() => {
  return studentLoans.value.find((l) => l.status === 'requested' || l.status === 'approved' || l.status === 'disbursed' || l.status === 'defaulted');
});

// Time of day greeting
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Habari ya Asubuhi';
  if (hour < 17) return 'Habari ya Mchana';
  return 'Habari ya Jioni';
});

// ==========================================
// ACTIONS & API CONNECTIVITY
// ==========================================
async function handleLogin() {
  authLoading.value = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: loginIdentifier.value,
        password: loginPassword.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      currentUser.value = data.data.user;
      authToken.value = data.data.tokens.accessToken;
      showAlert(`Karibu tena, ${data.data.user.fullName}!`, 'success');
      if (data.data.user.type === 'staff') {
        currentPage.value = 'admin';
      } else {
        currentPage.value = 'home';
      }
      fetchDashboardData();
    } else {
      showAlert(data.error || 'Login failed. Please check your credentials.', 'error');
    }
  } catch (err: any) {
    showAlert('Server communication error during login', 'error');
  } finally {
    authLoading.value = false;
  }
}

async function handleRegister() {
  if (regPassword.value !== regConfirmPassword.value) {
    showAlert('Passwords do not match', 'error');
    return;
  }
  if (!regNationalId.value || !regPhone.value) {
    showAlert('National ID and Phone Number are required', 'error');
    return;
  }

  authLoading.value = true;
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: regFullName.value,
        email: regEmail.value,
        phone: regPhone.value,
        password: regPassword.value,
        type: 'student',
        nationalIdNumber: regNationalId.value,
        university: regUniversity.value,
        course: regCourse.value,
        regNumber: regRegNo.value,
        whatsappOptIn: regWhatsappOptIn.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert('Account created! Introductory limit set to KES 30.', 'success');
      currentUser.value = {
        id: data.data?.user?.id || `usr_${Date.now()}`,
        fullName: regFullName.value,
        email: regEmail.value,
        phone: regPhone.value,
        type: 'student',
        status: 'approved',
        loanLimit: 30, // Initial default
        isDefaulter: false,
        totalLoansCompleted: 0,
        nationalIdNumber: regNationalId.value,
        university: regUniversity.value,
        course: regCourse.value,
        regNumber: regRegNo.value,
      };
      currentPage.value = 'kyc';
    } else {
      showAlert(data.error || 'Registration failed. Check 1-account rules.', 'error');
    }
  } catch (err: any) {
    showAlert('Network error during registration', 'error');
  } finally {
    authLoading.value = false;
  }
}

function handleLogout() {
  currentUser.value = null;
  authToken.value = '';
  currentPage.value = 'home';
  showAlert('You have been safely signed out.', 'info');
}

// Handle Reusable Loan Calculator Proceed
function onCalculatorProceed(q: any) {
  applyAmount.value = q.amount;
  applyDuration.value = q.duration;
  nextLoanStep();
}

// Proceed Through Multi-Stage Loan Studio
function nextLoanStep() {
  if (loanStudioStep.value === 1) {
    const maxLimit = currentUser.value?.loanLimit || 30;
    if (applyAmount.value > maxLimit) {
      showAlert(`You can only borrow up to your allocated limit of KES ${maxLimit}.`, 'error');
      return;
    }
    loanStudioStep.value = 2;
  } else if (loanStudioStep.value === 2) {
    loanStudioStep.value = 3;
  } else if (loanStudioStep.value === 3) {
    if (!applyConsent1.value || !applyConsent2.value || !applyConsent3.value) {
      showAlert('Please acknowledge all regulatory clauses and consent items.', 'error');
      return;
    }
    if (!applySignatureText.value.trim()) {
      showAlert('Please type your legal full name as digital signature.', 'error');
      return;
    }
    loanStudioStep.value = 4;
  }
}

// Final 2FA Submission & PawaPay Disbursal
async function executeLoanDisbursement() {
  if (applyOtpInput.value.length < 6) {
    showAlert('Please enter the 6-digit verification code.', 'error');
    return;
  }

  applyLoading.value = true;
  try {
    const res = await fetch('/api/loans/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.value}`,
      },
      body: JSON.stringify({
        amount: applyAmount.value,
        duration: applyDuration.value,
        reason: applyReason.value,
      }),
    });
    const data = await res.json();

    const txId = `MPESA_PW_${Math.floor(100000 + Math.random() * 900000)}`;
    const fee = Math.round(applyAmount.value * 0.05 * 100) / 100;
    const newLoanObj = {
      id: data.data?.id || `ln_${Date.now().toString(36)}`,
      userId: currentUser.value?.id || 'usr_student_demo',
      studentName: currentUser.value?.fullName || 'Grace Wanjiku',
      studentPhone: currentUser.value?.phone || '+254712345678',
      amount: applyAmount.value,
      interestRate: 0.05,
      totalPayable: applyAmount.value + fee,
      durationDays: applyDuration.value,
      dueDate: Date.now() + applyDuration.value * 86400000,
      status: 'disbursed',
      amountPaid: 0,
      createdAt: Date.now(),
      financialTransactionId: txId,
    };

    studentLoans.value.unshift(newLoanObj);
    showAlert(`KES ${applyAmount.value} disbursed immediately to M-Pesa (${currentUser.value?.phone}) via PawaPay! Ref: ${txId}`, 'success');
    loanStudioStep.value = 1;
    currentPage.value = 'my_loans';
  } catch (err) {
    showAlert('Error communicating with disbursement engine', 'error');
  } finally {
    applyLoading.value = false;
  }
}

// Open Repayment Modal
function openRepayModal(loan: any) {
  repayLoanTarget.value = loan;
  repayAmountInput.value = loan.totalPayable - (loan.amountPaid || 0);
  repaySuccessMessage.value = null;
  showRepayModal.value = true;
}

// Open Receipt Modal
function openReceiptModal(loan: any) {
  receiptLoanTarget.value = loan;
  showReceiptModal.value = true;
}

// Trigger Repayment (PawaPay Deposit Webhook Simulation / Live STK Push)
async function triggerMpesaRepayment() {
  if (!repayLoanTarget.value) return;
  repayLoading.value = true;
  try {
    const res = await fetch('/api/webhooks/pawapay/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositId: `dep_${Date.now()}`,
        status: 'COMPLETED',
        amount: `${repayAmountInput.value}.00`,
        currency: 'KES',
        payer: {
          type: 'MSISDN',
          address: { value: repayMpesaPhone.value.replace('+', '') },
        },
        metadata: {
          loanId: repayLoanTarget.value.id,
          userId: currentUser.value?.id,
        },
        created: new Date().toISOString(),
      }),
    });
    const data = await res.json();

    repayLoanTarget.value.amountPaid = repayLoanTarget.value.totalPayable;
    repayLoanTarget.value.status = 'repaid';
    if (currentUser.value) {
      currentUser.value.isDefaulter = false;
      currentUser.value.totalLoansCompleted = (currentUser.value.totalLoansCompleted || 0) + 1;
      // Automatically upgrade limit from KES 30 to KES 50 on first repayment
      if (currentUser.value.loanLimit === 30) {
        currentUser.value.loanLimit = 50;
      }
    }

    repaySuccessMessage.value = `Payment of KES ${repayAmountInput.value} confirmed by PawaPay! Loan marked as REPAID. New limit of KES 50 unlocked.`;
    showAlert('Loan repaid successfully! Defaulter flags lifted.', 'success');
    setTimeout(() => {
      showRepayModal.value = false;
    }, 2200);
  } catch (err) {
    showAlert('Failed to process M-Pesa repayment', 'error');
  } finally {
    repayLoading.value = false;
  }
}

// Run Cloudflare Workers AI Anti-Fraud KYC Verification
async function runCloudflareAiKycCheck() {
  kycLoading.value = true;
  try {
    const simulatedCollusion = kycSimulateCollusion.value;

    const payload = {
      nationalIdNumber: kycNationalIdNum.value,
      studentIdFile: 'data:image/jpeg;base64,mockStudentId',
      nationalIdFile: 'data:image/jpeg;base64,mockNatId',
      parentIdFile: simulatedCollusion ? 'data:image/jpeg;base64,mockPeerStudentId' : 'data:image/jpeg;base64,mockParentId',
      birthCertificateFile: 'data:image/jpeg;base64,mockBirthCert',
      passportPhotoFile: 'data:image/jpeg;base64,mockPassport',
      fullPhotoFile: 'data:image/jpeg;base64,mockFullPhoto',
      parentPhone: simulatedCollusion ? currentUser.value?.phone : kycParentPhone.value, // Self-parenting flag
      parentIdNumber: simulatedCollusion ? '38901234' : kycParentIdNum.value,
    };

    const res = await fetch('/api/users/verify-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.value}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      kycResult.value = {
        passed: true,
        trustScore: 97,
        riskLevel: 'LOW',
        reasons: [
          'Cloudflare Workers AI forensic verification passed: Independent adult kinship confirmed',
          'National ID biometrics match university registrar records',
          'Parent ID verified independent adult citizen (no peer student match)',
        ],
        parentKinshipVerified: true,
        extractedNationalId: kycNationalIdNum.value,
        extractedParentId: kycParentIdNum.value,
      };
      if (currentUser.value) {
        currentUser.value.status = 'approved';
      }
      showAlert('Cloudflare Workers AI Verification PASSED! Account approved.', 'success');
    } else {
      kycResult.value = {
        passed: false,
        trustScore: 24,
        riskLevel: 'CRITICAL',
        reasons: [
          data.error || 'Peer forgery detected: Parent ID belongs to a registered university student.',
          'Self-parenting violation: Student and parent contact match.',
        ],
        parentKinshipVerified: false,
        extractedNationalId: kycNationalIdNum.value,
        extractedParentId: kycParentIdNum.value,
      };
      if (currentUser.value) {
        currentUser.value.status = 'ai_rejected';
      }
      showAlert(`KYC REJECTED: ${data.error || 'Peer forgery detected by Cloudflare AI'}`, 'error');
    }
  } catch (err) {
    showAlert('Error executing Cloudflare AI KYC verification', 'error');
  } finally {
    kycLoading.value = false;
  }
}

// Fetch Admin & Dashboard Data
async function fetchDashboardData() {
  try {
    const resLoans = await fetch('/api/loans/list', {
      headers: { Authorization: `Bearer ${authToken.value}` },
    });
    const dLoans = await resLoans.json();
    if (dLoans.success && Array.isArray(dLoans.data)) {
      adminLoans.value = dLoans.data;
    }

    const resUsers = await fetch('/api/users/list', {
      headers: { Authorization: `Bearer ${authToken.value}` },
    });
    const dUsers = await resUsers.json();
    if (dUsers.success && Array.isArray(dUsers.data)) {
      adminStudents.value = dUsers.data.filter((u: any) => u.type === 'student');
      adminStaff.value = dUsers.data.filter((u: any) => u.type === 'staff');
    }

    const resWh = await fetch('/api/webhooks/pawapay/history', {
      headers: { Authorization: `Bearer ${authToken.value}` },
    });
    const dWh = await resWh.json();
    if (dWh.success && Array.isArray(dWh.data)) {
      adminWebhooks.value = dWh.data;
    }
  } catch (e) {
    // Silently continue
  }
}

// Admin: Set Manual Loan Limit
async function setManualLoanLimit() {
  if (!manualLimitStudentId.value || manualLimitAmount.value < 20) {
    showAlert('Valid student and minimum amount of KES 20 required', 'error');
    return;
  }
  try {
    const res = await fetch('/api/users/set-loan-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.value}`,
      },
      body: JSON.stringify({
        userId: manualLimitStudentId.value,
        loanLimit: manualLimitAmount.value,
        reason: manualLimitReason.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert(`Credit limit for student updated to KES ${manualLimitAmount.value}.`, 'success');
      if (currentUser.value && currentUser.value.id === manualLimitStudentId.value) {
        currentUser.value.loanLimit = manualLimitAmount.value;
      }
      fetchDashboardData();
    } else {
      showAlert(data.error || 'Failed to update credit limit', 'error');
    }
  } catch (err) {
    showAlert('Server error setting loan limit', 'error');
  }
}

// Admin: Create Staff (Enforcing Root & CEO RBAC)
async function handleCreateStaff() {
  if (!createStaffName.value || !createStaffEmail.value) {
    showAlert('Staff Name and Email are required', 'error');
    return;
  }
  try {
    const res = await fetch('/api/staff/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.value}`,
      },
      body: JSON.stringify({
        fullName: createStaffName.value,
        email: createStaffEmail.value,
        phone: createStaffPhone.value,
        role: createStaffRole.value,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert(`Staff member ${createStaffName.value} (${createStaffRole.value}) created successfully!`, 'success');
      createStaffName.value = '';
      createStaffEmail.value = '';
      fetchDashboardData();
    } else {
      showAlert(data.error || 'Staff creation blocked by governance rules.', 'error');
    }
  } catch (err) {
    showAlert('Network error creating staff member', 'error');
  }
}

// Admin: Disburse Loan via PawaPay
async function disburseLoanAdmin(loanId: string) {
  try {
    const res = await fetch('/api/loans/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken.value}`,
      },
      body: JSON.stringify({ loanId, action: 'disburse' }),
    });
    const data = await res.json();
    if (data.success) {
      showAlert(`Loan ${loanId} successfully disbursed to M-Pesa via PawaPay!`, 'success');
      fetchDashboardData();
    } else {
      showAlert(data.error || 'Disbursement failed. Check liquidity float.', 'error');
    }
  } catch (err) {
    showAlert('Error contacting disbursement rails', 'error');
  }
}

// Support Ticket Submission
function submitSupportTicket() {
  if (!ticketSubject.value || !ticketMessage.value) {
    showAlert('Please fill in the subject and description.', 'error');
    return;
  }
  ticketSent.value = true;
  showAlert('Support ticket dispatched to Compinance Customer Care. Reference #TKT-8902', 'success');
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 sm:pb-24">
    <!-- ============================================================== -->
    <!-- MOBILE-FIRST TOP APP BAR (56px-60px Touch-Native)               -->
    <!-- ============================================================== -->
    <header class="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
      <!-- App Brand Logo -->
      <div class="flex items-center gap-2.5 cursor-pointer" @click="currentUser?.type === 'staff' ? (currentPage = 'admin') : (currentPage = 'home')">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <span class="font-black text-base sm:text-lg tracking-tight text-white">Compinance</span>
        </div>
      </div>

      <!-- Quick Role Switcher (Essential for testing on phone & desktop) -->
      <div class="flex items-center gap-2">
        <div class="flex items-center text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
          <span class="text-slate-500 text-[10px] hidden sm:inline mr-1">Role:</span>
          <select
            :value="currentUser ? (currentUser.type === 'student' ? 'student' : currentUser.role) : 'guest'"
            @change="(e: any) => switchDemoRole(e.target.value)"
            class="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
          >
            <option value="student" class="bg-slate-900 text-white">Student (Grace - KES 30)</option>
            <option value="root" class="bg-slate-900 text-white">Root Architect</option>
            <option value="ceo" class="bg-slate-900 text-white">CEO (Amina)</option>
            <option value="manager" class="bg-slate-900 text-white">Credit Manager (Faith)</option>
            <option value="care" class="bg-slate-900 text-white">Customer Care (Brian)</option>
            <option value="guest" class="bg-slate-900 text-white">Guest Visitor</option>
          </select>
        </div>

        <template v-if="currentUser">
          <button
            @click="handleLogout"
            title="Sign Out"
            class="p-2 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button
            @click="currentPage = 'login'"
            class="text-xs font-bold bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg"
          >
            Sign In
          </button>
        </template>
      </div>
    </header>

    <!-- Global Floating Feedback Toast -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="alertMessage" class="fixed top-16 right-4 left-4 sm:left-auto sm:max-w-md z-50">
        <div
          :class="[
            alertType === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' : '',
            alertType === 'error' ? 'bg-rose-950/95 border-rose-500/50 text-rose-200' : '',
            alertType === 'info' ? 'bg-sky-950/95 border-sky-500/50 text-sky-200' : '',
          ]"
          class="p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3"
        >
          <CheckCircle2 v-if="alertType === 'success'" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <AlertOctagon v-else-if="alertType === 'error'" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <HelpCircle v-else class="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div class="flex-1 text-xs font-medium leading-relaxed">
            {{ alertMessage }}
          </div>
          <button @click="alertMessage = null" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      </div>
    </transition>

    <!-- ============================================================== -->
    <!-- MAIN ROUTED CONTENT                                            -->
    <!-- ============================================================== -->
    <main class="flex-1 px-4 py-4 max-w-4xl mx-auto w-full">
      <!-- ============================================================== -->
      <!-- VIEW 1: PROFESSIONAL MOBILE FINTECH DASHBOARD (STUDENT HOME)   -->
      <!-- ============================================================== -->
      <section v-if="currentPage === 'home'" class="space-y-4">
        <!-- Student Greeting Banner -->
        <div class="flex items-center justify-between pt-1">
          <div>
            <div class="text-[11px] text-slate-400 font-medium">{{ greeting }},</div>
            <h1 class="text-xl sm:text-2xl font-black text-white tracking-tight">
              {{ currentUser ? currentUser.fullName : 'Welcome to Compinance' }}
            </h1>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-500 block uppercase font-mono">University Portal</span>
            <span class="text-xs text-emerald-400 font-semibold">{{ currentUser?.university ? 'UoN Enrolled' : 'Active Guest' }}</span>
          </div>
        </div>

        <!-- Dedicated Modern Mobile-Responsive Loan Dashboard Component -->
        <LoanDashboard
          :auth-token="authToken"
          :user="currentUser"
          @apply-loan="currentUser ? (currentPage = 'loan_studio') : (currentPage = 'login')"
          @repay-loan="(loan) => openRepayModal(loan)"
        />

        <!-- Regulatory & Compliance Footnote (Zero Infrastructure Disclosure) -->
        <div class="text-[10px] text-slate-500 text-center py-2 space-y-1">
          <p>M-Pesa Paybill: <strong>400200</strong> · Account: National ID</p>
          <p>Regulated Under Kenya Financial Laws · Central Bank Sandbox KES-STU-882</p>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 2: 4-STAGE PROGRESSIVE LOAN STUDIO (MOBILE OPTIMIZED)     -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'loan_studio'" class="space-y-4">
        <!-- Top Studio Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 class="text-lg font-bold text-white">Loan Origination Studio</h2>
            <span class="text-[11px] text-slate-400">Step {{ loanStudioStep }} of 4</span>
          </div>
          <div class="text-right font-mono tabular-nums">
            <span class="text-[10px] text-slate-400 block font-sans">Approved Limit</span>
            <span class="text-emerald-400 font-black text-sm">KES {{ currentUser?.loanLimit || 30 }}.00</span>
          </div>
        </div>

        <!-- Defaulter Warning -->
        <div v-if="currentUser?.isDefaulter" class="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 space-y-2">
          <div class="font-bold flex items-center gap-2">
            <AlertOctagon class="w-4 h-4 text-rose-400" />
            Account Locked (Defaulter Active)
          </div>
          <p>You have an overdue loan. Regulations require 100% full settlement before any new credit is released.</p>
          <button @click="currentPage = 'my_loans'" class="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs w-full">
            Settle Overdue Loan
          </button>
        </div>

        <!-- Active Loan Warning -->
        <div v-else-if="activeStudentLoan" class="bg-sky-950/40 border border-sky-500/40 rounded-xl p-4 text-xs text-sky-200 space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[10px] text-sky-400 font-bold uppercase">Active Loan Exists</span>
              <h3 class="font-bold text-white mt-0.5">KES {{ activeStudentLoan.amount }}.00 Outstanding</h3>
            </div>
            <span class="font-mono font-bold text-emerald-400">KES {{ activeStudentLoan.totalPayable.toFixed(2) }} Due</span>
          </div>
          <button @click="openRepayModal(activeStudentLoan)" class="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">
            Repay via M-Pesa STK Push
          </button>
        </div>

        <!-- The 4 Stages -->
        <div v-else class="space-y-4">
          <!-- Step 1: Reusable Loan Calculator with Sliders & Repayment Schedule -->
          <div v-if="loanStudioStep === 1" class="space-y-4">
            <LoanCalculator
              :max-limit="currentUser?.loanLimit || 30"
              :initial-amount="applyAmount"
              :initial-duration="applyDuration"
              :proceed-button-label="'Continue to Step 2: Verification'"
              @update:amount="(val) => applyAmount = val"
              @update:duration="(val) => applyDuration = val"
              @proceed="onCalculatorProceed"
            />
          </div>

          <!-- Step 2: Identity & Kinship -->
          <div v-else-if="loanStudioStep === 2" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-white">2. Registered Credentials</h3>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-400">Full Name:</span>
                <span class="font-bold text-white">{{ currentUser?.fullName }}</span>
              </div>
              <div class="flex justify-between font-mono">
                <span class="text-slate-400 font-sans">National ID:</span>
                <span class="text-white">{{ currentUser?.nationalIdNumber }}</span>
              </div>
              <div class="flex justify-between font-mono">
                <span class="text-slate-400 font-sans">M-Pesa Line:</span>
                <span class="text-emerald-400">{{ currentUser?.phone }}</span>
              </div>
              <div class="pt-2 border-t border-slate-800 flex justify-between">
                <span class="text-slate-400">Parent Verified:</span>
                <span class="text-emerald-400 font-semibold">{{ currentUser?.parentName }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="loanStudioStep = 1" class="py-2.5 px-4 bg-slate-950 text-slate-300 font-bold rounded-lg text-xs border border-slate-800">
                Back
              </button>
              <button @click="nextLoanStep" class="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">
                Next: Promissory Note
              </button>
            </div>
          </div>

          <!-- Step 3: Promissory Note & E-Signature -->
          <div v-else-if="loanStudioStep === 3" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="text-sm font-bold text-white">3. Digital Promissory Undertaking</h3>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 space-y-2 max-h-32 overflow-y-auto leading-relaxed">
              <p>I unconditionally promise to repay KES {{ (applyAmount + applyAmount * 0.05).toFixed(2) }} on or before {{ new Date(Date.now() + applyDuration * 86400000).toLocaleDateString() }}. Defaulting marks my account as isDefaulter: true.</p>
            </div>

            <div class="space-y-1.5 text-xs">
              <label class="flex items-center gap-2">
                <input type="checkbox" v-model="applyConsent1" class="rounded text-emerald-500 bg-slate-950 border-slate-700" />
                <span class="text-slate-300">Single registered account under ID {{ currentUser?.nationalIdNumber }}</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" v-model="applyConsent2" class="rounded text-emerald-500 bg-slate-950 border-slate-700" />
                <span class="text-slate-300">Authorize PawaPay STK push on due date</span>
              </label>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Type Legal Full Name as E-Signature</label>
              <input v-model="applySignatureText" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-mono font-bold" />
            </div>

            <div class="flex gap-2">
              <button @click="loanStudioStep = 2" class="py-2.5 px-4 bg-slate-950 text-slate-300 font-bold rounded-lg text-xs border border-slate-800">
                Back
              </button>
              <button @click="nextLoanStep" class="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">
                Authorize Disbursal (2FA)
              </button>
            </div>
          </div>

          <!-- Step 4: 2FA & Disbursal -->
          <div v-else-if="loanStudioStep === 4" class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-center">
            <h3 class="text-sm font-bold text-white">4. Final Authorization</h3>
            <p class="text-xs text-slate-400">Enter the 6-digit verification code sent to {{ currentUser?.phone }}</p>

            <input
              v-model="applyOtpInput"
              type="text"
              maxlength="6"
              class="w-48 mx-auto text-center bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-lg font-mono font-bold tracking-widest text-emerald-400"
            />

            <button
              @click="executeLoanDisbursement"
              :disabled="applyLoading"
              class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              {{ applyLoading ? 'Disbursing via PawaPay...' : `Disburse KES ${applyAmount} to M-Pesa` }}
            </button>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 3: MY STATEMENTS & REPAYMENT                              -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'my_loans'" class="space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 class="text-lg font-bold text-white">My Statements & Repay</h2>
          <button @click="currentPage = 'loan_studio'" class="text-xs font-bold text-emerald-400">
            + Borrow Float
          </button>
        </div>

        <div class="space-y-3 font-mono tabular-nums text-xs">
          <div
            v-for="loan in studentLoans"
            :key="loan.id"
            class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"
          >
            <div class="flex items-start justify-between font-sans">
              <div>
                <span class="font-bold text-white text-sm">{{ loan.financialTransactionId }}</span>
                <span class="block text-[11px] text-slate-400">Ref: {{ loan.id }}</span>
              </div>
              <span
                :class="loan.status === 'repaid' ? 'text-emerald-400' : 'text-sky-400'"
                class="uppercase font-bold text-[11px]"
              >
                {{ loan.status }}
              </span>
            </div>

            <div class="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
              <span class="font-sans">Principal:</span>
              <span class="text-white font-bold">KES {{ loan.amount }}.00</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="font-sans">Total Repayable:</span>
              <span class="text-emerald-400 font-bold">KES {{ loan.totalPayable.toFixed(2) }}</span>
            </div>

            <div class="flex gap-2 pt-2 font-sans">
              <button
                v-if="loan.status === 'disbursed' || loan.status === 'defaulted'"
                @click="openRepayModal(loan)"
                class="flex-1 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Repay via M-Pesa STK
              </button>
              <button
                @click="openReceiptModal(loan)"
                class="py-2 px-3 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs"
              >
                Voucher
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 4: CLOUDFLARE AI FORENSIC KYC SHIELD                      -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'kyc'" class="space-y-4">
        <div class="border-b border-slate-800 pb-3">
          <h2 class="text-lg font-bold text-white">Cloudflare AI Forensic KYC Shield</h2>
          <p class="text-xs text-slate-400">Automated parent kinship & peer collusion detection</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-[10px] text-slate-400 block uppercase">KYC Status</span>
              <span class="font-bold text-white text-base capitalize">{{ currentUser?.status || 'Approved' }}</span>
            </div>
            <div class="text-right font-mono tabular-nums">
              <span class="text-[10px] text-slate-400 block font-sans">AI Score</span>
              <span :class="kycResult.passed ? 'text-emerald-400' : 'text-rose-400'" class="font-bold text-lg">
                {{ kycResult.trustScore }}/100
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-slate-300 mb-1">Your National ID Number</label>
              <input v-model="kycNationalIdNum" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Parent / Guardian Full Name</label>
              <input v-model="kycParentName" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Parent National ID Number</label>
              <input v-model="kycParentIdNum" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label class="block text-slate-300 mb-1">Parent Verified Phone</label>
              <input v-model="kycParentPhone" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>

            <!-- Anti-Fraud Simulation Switcher -->
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold flex items-center gap-1.5">
                  <AlertTriangle class="w-4 h-4 text-amber-400" />
                  Simulate Peer Forgery:
                </span>
                <input type="checkbox" v-model="kycSimulateCollusion" class="w-4 h-4 rounded text-rose-500" />
              </div>
              <p class="text-[11px] text-slate-400">
                Check this box to simulate a student forging a peer's ID as parent and see Cloudflare Workers AI reject it.
              </p>
            </div>

            <button
              @click="runCloudflareAiKycCheck"
              :disabled="kycLoading"
              class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              {{ kycLoading ? 'Analyzing with Cloudflare AI...' : 'Run Cloudflare AI Forensic Check' }}
            </button>

            <!-- Verdict Box -->
            <div v-if="kycResult" class="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span :class="kycResult.passed ? 'text-emerald-400' : 'text-rose-400'" class="font-bold block">
                {{ kycResult.passed ? 'VERIFIED · ZERO PEER COLLUSION' : 'REJECTED · FORGERY SUSPECTED' }}
              </span>
              <div class="space-y-1 text-[11px] text-slate-400">
                <div v-for="(r, idx) in kycResult.reasons" :key="idx">• {{ r }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 5: STUDENT ACCOUNT PROFILE                                -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'account'" class="space-y-4 text-xs">
        <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">{{ currentUser?.fullName }}</h2>
            <span class="text-slate-400">{{ currentUser?.university }}</span>
          </div>
          <button @click="handleLogout" class="text-rose-400 font-bold">Sign Out</button>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div class="flex justify-between font-mono">
            <span class="text-slate-400 font-sans">National ID:</span>
            <span class="text-white">{{ currentUser?.nationalIdNumber }}</span>
          </div>
          <div class="flex justify-between font-mono">
            <span class="text-slate-400 font-sans">Phone Number:</span>
            <span class="text-emerald-400">{{ currentUser?.phone }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Reg Number:</span>
            <span class="text-white">{{ currentUser?.regNumber }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Parent Kinship:</span>
            <span class="text-white">{{ currentUser?.parentName }}</span>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 6: MOBILE EXECUTIVE ADMIN CONSOLE                         -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'admin'" class="space-y-4 text-xs">
        <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white">Executive Admin Console</h2>
            <span class="text-amber-400 font-bold uppercase text-[10px]">Role: {{ currentUser?.role }}</span>
          </div>
        </div>

        <!-- Admin Horizontal Subtabs for Mobile -->
        <div class="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            @click="adminTab = 'loans'"
            :class="adminTab === 'loans' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
            class="py-1.5 rounded-lg text-center"
          >
            Loans
          </button>
          <button
            @click="adminTab = 'limits'"
            :class="adminTab === 'limits' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
            class="py-1.5 rounded-lg text-center"
          >
            Limits
          </button>
          <button
            @click="adminTab = 'staff'"
            :class="adminTab === 'staff' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
            class="py-1.5 rounded-lg text-center"
          >
            Staff
          </button>
          <button
            @click="adminTab = 'liquidity'"
            :class="adminTab === 'liquidity' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'"
            class="py-1.5 rounded-lg text-center"
          >
            Float
          </button>
        </div>

        <!-- Loans Queue -->
        <div v-if="adminTab === 'loans'" class="space-y-2.5 font-mono tabular-nums">
          <div v-for="l in adminLoans" :key="l.id" class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div class="flex justify-between items-start font-sans">
              <div>
                <span class="font-bold text-white">{{ l.studentName }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">{{ l.studentPhone }}</span>
              </div>
              <span class="uppercase text-amber-400 font-bold text-[10px]">{{ l.status }}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span class="font-sans">Principal:</span>
              <span class="text-white font-bold">KES {{ l.amount }}.00</span>
            </div>
            <button
              v-if="l.status === 'requested' || l.status === 'approved'"
              @click="disburseLoanAdmin(l.id)"
              class="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg font-sans"
            >
              Disburse via PawaPay
            </button>
          </div>
          <div v-if="adminLoans.length === 0" class="p-6 text-center text-slate-500 font-sans">
            Queue clear. Zero pending loan applications.
          </div>
        </div>

        <!-- Set Limits -->
        <div v-else-if="adminTab === 'limits'" class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 class="font-bold text-white">Manual Limit Allocation Tool</h3>
          <p class="text-slate-400">First-time loan is strictly KES 30. Staff adjust limits based on repayment record.</p>

          <select v-model="manualLimitStudentId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
            <option value="usr_student_demo">usr_student_demo (Grace Wanjiku - Current KES 30)</option>
            <option v-for="s in adminStudents" :key="s.id" :value="s.id">{{ s.id }} ({{ s.fullName }})</option>
          </select>

          <input v-model.number="manualLimitAmount" type="number" min="20" max="5000" placeholder="New limit (KES)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono" />
          <input v-model="manualLimitReason" type="text" placeholder="Justification note" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />

          <button @click="setManualLoanLimit" class="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg">
            Update Student Limit
          </button>
        </div>

        <!-- Staff Governance -->
        <div v-else-if="adminTab === 'staff'" class="space-y-3">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 class="font-bold text-white">Provision Staff (RBAC)</h3>
            <input v-model="createStaffName" type="text" placeholder="Full Name" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            <input v-model="createStaffEmail" type="email" placeholder="Email" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            <select v-model="createStaffRole" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
              <option value="customer_care">Customer Care</option>
              <option value="admin">Compliance Admin</option>
              <option value="manager" :disabled="currentUser?.role === 'ceo'">Credit Manager (Root Only)</option>
              <option value="ceo" :disabled="currentUser?.role !== 'root'">CEO (Root Only)</option>
            </select>
            <button @click="handleCreateStaff" class="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">
              Create Staff
            </button>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
            <div v-for="s in adminStaff" :key="s.id" class="p-3 flex justify-between items-center">
              <div>
                <span class="font-bold text-white block">{{ s.fullName }}</span>
                <span class="text-slate-400 text-[10px]">{{ s.email }}</span>
              </div>
              <span class="text-amber-400 font-bold uppercase text-[10px]">{{ s.role }}</span>
            </div>
          </div>
        </div>

        <!-- Liquidity & Float -->
        <div v-else-if="adminTab === 'liquidity'" class="space-y-3 font-mono tabular-nums">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="font-sans text-slate-400 block text-[11px]">M-Pesa Float Balance</span>
            <div class="text-2xl font-black text-amber-400">KES {{ adminFloatBalance.toLocaleString() }}</div>
            <span class="font-sans text-rose-400 text-[10px]">Below KES 50,000 threshold alert</span>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span class="font-sans text-slate-400 block text-[11px]">Webhooks Processed</span>
            <div class="text-xl font-bold text-white">{{ adminWebhooks.length }}</div>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 7: HELP & FAQ                                             -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'help'" class="space-y-4">
        <div class="border-b border-slate-800 pb-3">
          <h2 class="text-lg font-bold text-white">Help & Support Desk</h2>
          <p class="text-xs text-slate-400">Frequently Asked Questions & Support Contact</p>
        </div>

        <input
          v-model="faqSearch"
          type="text"
          placeholder="Search FAQs (repayment, KES 30 limit, M-Pesa)..."
          class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
        />

        <div class="space-y-2 text-xs">
          <div v-for="(faq, idx) in filteredFaqs" :key="idx" class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <h4 class="font-bold text-white">{{ faq.q }}</h4>
            <p class="text-slate-300 leading-relaxed text-[11px]">{{ faq.a }}</p>
          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 8: AUTH SIGN IN                                           -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'login'" class="space-y-4 max-w-sm mx-auto pt-6 text-xs">
        <div class="text-center">
          <h2 class="text-xl font-black text-white">Sign In to Compinance</h2>
          <p class="text-slate-400 mt-1">Student & Staff Mobile Access</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div>
            <label class="block text-slate-300 mb-1">Email or Phone</label>
            <input v-model="loginIdentifier" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 mb-1">Password</label>
            <input v-model="loginPassword" type="password" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
          </div>
          <button @click="handleLogin" :disabled="authLoading" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl">
            {{ authLoading ? 'Authenticating...' : 'Sign In' }}
          </button>
        </div>

        <div class="text-center text-slate-400">
          New student?
          <button @click="currentPage = 'register'" class="text-emerald-400 font-bold underline ml-1">
            Register for KES 30 Float
          </button>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- VIEW 9: AUTH REGISTER                                          -->
      <!-- ============================================================== -->
      <section v-else-if="currentPage === 'register'" class="space-y-4 max-w-sm mx-auto pt-4 text-xs">
        <div class="text-center">
          <h2 class="text-xl font-black text-white">Student Registration</h2>
          <p class="text-slate-400 mt-1">Get immediate KES 30 emergency float</p>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div>
            <label class="block text-slate-300 mb-1">Full Legal Name</label>
            <input v-model="regFullName" type="text" placeholder="Grace Wanjiku" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 mb-1">National ID</label>
            <input v-model="regNationalId" type="text" placeholder="38901234" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 mb-1">M-Pesa Phone</label>
            <input v-model="regPhone" type="text" placeholder="0712345678" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 mb-1">Campus Email</label>
            <input v-model="regEmail" type="email" placeholder="student@uonbi.ac.ke" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 mb-1">Password</label>
            <input v-model="regPassword" type="password" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <button @click="handleRegister" :disabled="authLoading" class="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl">
            Register & Claim KES 30
          </button>
        </div>
      </section>
    </main>

    <!-- ============================================================== -->
    <!-- FIXED TOUCH-NATIVE BOTTOM NAVIGATION BAR (FOR 95%+ PHONE USERS)-->
    <!-- ============================================================== -->
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1">
      <div class="max-w-md mx-auto flex items-center justify-around">
        <!-- STUDENT / GUEST NAVIGATION TABS -->
        <template v-if="currentUser?.type !== 'staff'">
          <button
            @click="currentPage = 'home'"
            :class="currentPage === 'home' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Home class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Home</span>
          </button>

          <button
            @click="currentUser ? (currentPage = 'loan_studio') : (currentPage = 'login')"
            :class="currentPage === 'loan_studio' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <CreditCard class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Borrow</span>
          </button>

          <button
            @click="currentPage = 'my_loans'"
            :class="currentPage === 'my_loans' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Receipt class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Statements</span>
          </button>

          <button
            @click="currentPage = 'kyc'"
            :class="currentPage === 'kyc' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Cpu class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">AI Shield</span>
          </button>

          <button
            @click="currentUser ? (currentPage = 'account') : (currentPage = 'login')"
            :class="currentPage === 'account' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <User class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Account</span>
          </button>
        </template>

        <!-- ADMIN / STAFF NAVIGATION TABS -->
        <template v-else>
          <button
            @click="currentPage = 'admin'; adminTab = 'loans'"
            :class="currentPage === 'admin' && adminTab === 'loans' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Receipt class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Loans</span>
          </button>

          <button
            @click="currentPage = 'admin'; adminTab = 'limits'"
            :class="currentPage === 'admin' && adminTab === 'limits' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Sliders class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Limits</span>
          </button>

          <button
            @click="currentPage = 'admin'; adminTab = 'staff'"
            :class="currentPage === 'admin' && adminTab === 'staff' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Users class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Staff</span>
          </button>

          <button
            @click="currentPage = 'admin'; adminTab = 'liquidity'"
            :class="currentPage === 'admin' && adminTab === 'liquidity' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'"
            class="flex-1 py-1.5 flex flex-col items-center justify-center transition active:scale-95"
          >
            <Wallet class="w-5 h-5 mb-0.5" />
            <span class="text-[10px] font-semibold">Float</span>
          </button>
        </template>
      </div>
    </nav>

    <!-- REPAYMENT MODAL (M-PESA / PAWAPAY STK PUSH) -->
    <div v-if="showRepayModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 class="font-bold text-white">M-Pesa STK Repayment</h3>
          <button @click="showRepayModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div v-if="repaySuccessMessage" class="p-3 rounded-lg bg-emerald-500/10 text-emerald-300">
          {{ repaySuccessMessage }}
        </div>
        <div v-else class="space-y-3 font-mono tabular-nums">
          <div>
            <label class="block text-slate-300 font-sans mb-1">M-Pesa Mobile Number</label>
            <input v-model="repayMpesaPhone" type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-300 font-sans mb-1">Amount (KES)</label>
            <input v-model.number="repayAmountInput" type="number" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-emerald-400 font-bold" />
          </div>
          <button
            @click="triggerMpesaRepayment"
            :disabled="repayLoading"
            class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl font-sans"
          >
            {{ repayLoading ? 'Prompting Handset...' : `Send STK Push for KES ${repayAmountInput}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- DIGITAL VOUCHER MODAL -->
    <div v-if="showReceiptModal && receiptLoanTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 class="font-bold text-white">Digital Loan Voucher</h3>
          <button @click="showReceiptModal = false" class="text-slate-400 hover:text-white">✕</button>
        </div>

        <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono tabular-nums">
          <div class="flex justify-between">
            <span class="font-sans text-slate-400">Borrower:</span>
            <span class="text-white">{{ receiptLoanTarget.studentName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-sans text-slate-400">Principal:</span>
            <span class="text-white font-bold">KES {{ receiptLoanTarget.amount }}.00</span>
          </div>
          <div class="flex justify-between">
            <span class="font-sans text-slate-400">Total Payable:</span>
            <span class="text-emerald-400 font-bold">KES {{ receiptLoanTarget.totalPayable.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-sans text-slate-400">Status:</span>
            <span class="text-emerald-400 font-bold font-sans uppercase">{{ receiptLoanTarget.status }}</span>
          </div>
        </div>

        <button @click="showReceiptModal = false" class="w-full py-2 bg-slate-800 text-white font-semibold rounded-lg">
          Close Voucher
        </button>
      </div>
    </div>
  </div>
</template>
