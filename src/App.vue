<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ShieldCheck,
  BookOpen,
  Terminal,
  Play,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Database,
  Smartphone,
  Globe,
  Radio,
  Send,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FileText,
  Activity,
  UserCheck,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  Trash2,
  CloudLightning,
  AlertOctagon,
  Users,
} from 'lucide-vue-next';
import { ENDPOINTS_CATALOG, ApiDocEndpoint } from './endpoints/docs/endpoints-list';

// Navigation State
const activeMainTab = ref<'admin' | 'webhooks' | 'api' | 'cosmos'>('admin');
const activeAdminSubTab = ref<'loans' | 'kyc' | 'staff' | 'collections'>('loans');

// Active Session Role
const activeRoleSession = ref<string>('Root (root@compinance.co.ke)');
const currentCallerRole = ref<'student' | 'customer_care' | 'manager' | 'admin' | 'ceo' | 'root'>('root');

// Admin Data State
const adminLoading = ref<boolean>(false);
const adminMessage = ref<string | null>(null);
const adminMessageType = ref<'success' | 'error'>('success');

const loansList = ref<any[]>([]);
const studentsList = ref<any[]>([]);
const staffList = ref<any[]>([]);
const inventoryStats = ref<any>({
  totalDisbursedKes: 0,
  totalCollectedKes: 0,
  totalOutstandingKes: 0,
  activeCount: 0,
  defaultedCount: 0,
  defaultRatePercent: 0,
  companyFloatBalanceKes: 1500000,
  companyReserveFloorKes: 50000,
});

// Admin Form Inputs
const setLimitUserId = ref<string>('');
const setLimitAmount = ref<number>(30);
const setLimitReason = ref<string>('Manual credit allocation by compliance staff');

const newStaffName = ref<string>('');
const newStaffEmail = ref<string>('');
const newStaffPhone = ref<string>('0733112233');
const newStaffRole = ref<'customer_care' | 'manager' | 'admin' | 'ceo'>('customer_care');

const selectedDutyStaffId = ref<string>('');
const dutyApproveLoans = ref<boolean>(true);
const dutyVerifyKYC = ref<boolean>(true);

const assignLoanId = ref<string>('');
const assignCollectorId = ref<string>('');

// API & Docs Explorer
const selectedTag = ref<string>('All');
const tags = ['All', 'Loans & PawaPay', 'Users & KYC', 'Staff & RBAC', 'Auth'];
const selectedEndpoint = ref<ApiDocEndpoint>(ENDPOINTS_CATALOG[0]);
const requestBody = ref<string>(JSON.stringify(ENDPOINTS_CATALOG[0].bodySample || {}, null, 2));
const apiResponseOutput = ref<any>(null);
const apiResponseStatus = ref<number | null>(null);
const apiResponseHeaders = ref<Record<string, string>>({});
const apiLoading = ref<boolean>(false);
const copied = ref<boolean>(false);

// Cosmos DB State
const cosmosStatus = ref<{ connected: boolean; databaseId: string; endpoint: string; containers: string[] }>({
  connected: true,
  databaseId: 'compinance-db',
  endpoint: 'Local Managed Cosmos Instance',
  containers: ['users', 'loans', 'verifications', 'otps', 'audit_logs', 'pawapay_webhooks'],
});
const selectedContainer = ref<string>('loans');
const containerData = ref<any[]>([]);
const containerLoading = ref<boolean>(false);

// PawaPay Webhooks Suite
const selectedWebhookType = ref<'deposit' | 'payout' | 'refund' | 'float'>('deposit');
const webhookRequestBody = ref<string>('');
const webhookResponseOutput = ref<any>(null);
const webhookResponseStatus = ref<number | null>(null);
const webhookLoading = ref<boolean>(false);
const webhookHistory = ref<any[]>([]);

const webhookTemplates = {
  deposit: {
    path: '/api/webhooks/pawapay/deposits',
    title: '1. PawaPay Deposits Webhook (C2B Repayment)',
    description: 'Triggered when a student repays via M-Pesa STK push. Reconciles loan, lifts defaulter flag, and increases credit limit.',
    payload: {
      depositId: `dep_${Date.now()}`,
      status: 'COMPLETED',
      amount: 32,
      currency: 'KES',
      payer: { type: 'MSISDN', address: { value: '254712345678' } },
      correspondent: 'MPESA_KEN',
      statementDescription: 'Compinance Loan Repayment',
      financialTransactionId: `NL${Math.floor(100000000 + Math.random() * 900000000)}`,
      failureReason: null,
      created: new Date().toISOString(),
    },
  },
  payout: {
    path: '/api/webhooks/pawapay/payouts',
    title: '2. PawaPay Payouts Webhook (B2C Disbursement)',
    description: 'Sent when M-Pesa funds are deposited into student wallet. Sets loan status to active/disbursed.',
    payload: {
      payoutId: `payout_sample_${Date.now()}`,
      status: 'COMPLETED',
      amount: 5000,
      currency: 'KES',
      recipient: { type: 'MSISDN', address: { value: '254712345678' } },
      correspondent: 'MPESA_KEN',
      financialTransactionId: `MK${Math.floor(100000000 + Math.random() * 900000000)}`,
      failureReason: null,
      created: new Date().toISOString(),
    },
  },
  refund: {
    path: '/api/webhooks/pawapay/refunds',
    title: '3. PawaPay Refunds Webhook (Payment Reversals)',
    description: 'Adjusts student ledger in Cosmos DB when overpayments or disputed transactions are reversed.',
    payload: {
      refundId: `ref_${Date.now()}`,
      originalDepositId: `dep_sample_123`,
      status: 'COMPLETED',
      amount: 50,
      currency: 'KES',
      reason: 'Borrower overpayment credit adjustment',
      created: new Date().toISOString(),
    },
  },
  float: {
    path: '/api/webhooks/pawapay/float-notifications',
    title: '4. PawaPay Float & Liquidity Threshold Webhook',
    description: 'Real-time liquidity and reserve floor alerts. Warns if company float drops near or below KES 50,000.',
    payload: {
      notificationId: `fn_${Date.now()}`,
      accountNumber: 'ACC_KES_001',
      balanceKes: 1450000,
      currency: 'KES',
      alertLevel: 'NORMAL',
      minThresholdKes: 50000,
      message: 'Float liquidity is healthy and above safety reserve floor',
      timestamp: new Date().toISOString(),
    },
  },
};

const notify = (msg: string, isError = false) => {
  adminMessage.value = msg;
  adminMessageType.value = isError ? 'error' : 'success';
  setTimeout(() => {
    if (adminMessage.value === msg) adminMessage.value = null;
  }, 6000);
};

// Admin Operations
const fetchAdminData = async () => {
  adminLoading.value = true;
  try {
    const [loansRes, studentsRes, staffRes, invRes] = await Promise.all([
      fetch('/api/loans/list', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/users/list?type=student', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/staff/list', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/loans/inventory', { credentials: 'include' }).then((r) => r.json()),
    ]);

    if (loansRes.success) loansList.value = loansRes.data || [];
    if (studentsRes.success) studentsList.value = studentsRes.data || [];
    if (staffRes.success) staffList.value = staffRes.data || [];
    if (invRes.success && invRes.data) inventoryStats.value = invRes.data;
  } catch (err: any) {
    notify(`Failed loading admin data: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const approveLoan = async (loanId: string) => {
  adminLoading.value = true;
  try {
    const res = await fetch('/api/loans/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ loanId }),
    });
    const json = await res.json();
    if (json.success) {
      notify(`Loan ${loanId} approved and disbursed via PawaPay M-Pesa!`);
      await fetchAdminData();
    } else {
      notify(`Approval failed: ${json.error}`, true);
    }
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const approveKyc = async (userId: string, approved: boolean) => {
  adminLoading.value = true;
  try {
    const res = await fetch('/api/users/approve-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, approved, notes: 'Compliance review completed' }),
    });
    const json = await res.json();
    if (json.success) {
      notify(`Student account verification updated to '${approved ? 'approved' : 'rejected'}'! Default limit: KES 30.`);
      await fetchAdminData();
    } else {
      notify(`Failed: ${json.error}`, true);
    }
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const triggerParentChallenge = async (userId: string) => {
  adminLoading.value = true;
  try {
    const res = await fetch('/api/users/parent-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    notify(json.message || json.error, !json.success);
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const saveLoanLimit = async () => {
  if (!setLimitUserId.value || setLimitAmount.value < 20) {
    notify('Please select student and enter a valid allocation limit (>= KES 20)', true);
    return;
  }
  adminLoading.value = true;
  try {
    const res = await fetch('/api/users/set-loan-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: setLimitUserId.value,
        loanLimit: Number(setLimitAmount.value),
        reason: setLimitReason.value,
      }),
    });
    const json = await res.json();
    if (json.success) {
      notify(`Credit limit of KES ${setLimitAmount.value.toLocaleString()} allocated successfully!`);
      await fetchAdminData();
    } else {
      notify(`Failed: ${json.error}`, true);
    }
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const createStaffMember = async () => {
  if (!newStaffName.value || !newStaffEmail.value) {
    notify('Full name and email are required for staff provisioning', true);
    return;
  }
  adminLoading.value = true;
  try {
    const res = await fetch('/api/staff/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullName: newStaffName.value,
        email: newStaffEmail.value,
        phone: newStaffPhone.value,
        role: newStaffRole.value,
        password: 'Compinance2026!',
      }),
    });
    const json = await res.json();
    if (json.success) {
      notify(json.message);
      newStaffName.value = '';
      newStaffEmail.value = '';
      await fetchAdminData();
    } else {
      notify(`Governance violation: ${json.error}`, true);
    }
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const deleteStaffMember = async (staffId: string) => {
  if (!confirm('Are you sure you want to de-provision this staff account?')) return;
  adminLoading.value = true;
  try {
    const res = await fetch('/api/staff/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ staffId }),
    });
    const json = await res.json();
    if (json.success) {
      notify(json.message);
      await fetchAdminData();
    } else {
      notify(`Action blocked: ${json.error}`, true);
    }
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const assignExecutiveDuties = async () => {
  if (!selectedDutyStaffId.value) return;
  adminLoading.value = true;
  try {
    const res = await fetch('/api/staff/assign-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        staffId: selectedDutyStaffId.value,
        duties: { canApproveLoans: dutyApproveLoans.value, canVerifyKYC: dutyVerifyKYC.value },
      }),
    });
    const json = await res.json();
    notify(json.message || json.error, !json.success);
    if (json.success) await fetchAdminData();
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const assignCollectionOfficer = async () => {
  if (!assignLoanId.value || !assignCollectorId.value) return;
  adminLoading.value = true;
  try {
    const res = await fetch('/api/loans/assign-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ loanId: assignLoanId.value, collectorStaffId: assignCollectorId.value }),
    });
    const json = await res.json();
    notify(json.message || json.error, !json.success);
    if (json.success) await fetchAdminData();
  } catch (err: any) {
    notify(`Error: ${err.message}`, true);
  } finally {
    adminLoading.value = false;
  }
};

const quickLogin = async (roleName: string, email: string) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: email, password: 'Compinance2026!' }),
    });
    const json = await res.json();
    if (json.success) {
      activeRoleSession.value = `${roleName} (${email})`;
      currentCallerRole.value = (json.data?.user?.role || json.data?.user?.type) as any;
      notify(`Switched session to ${roleName}`);
      await fetchAdminData();
      if (activeMainTab.value === 'cosmos') await fetchContainerData();
    }
  } catch {}
};

// Webhook Suite methods
const setWebhookType = (type: 'deposit' | 'payout' | 'refund' | 'float') => {
  selectedWebhookType.value = type;
  webhookRequestBody.value = JSON.stringify(webhookTemplates[type].payload, null, 2);
  webhookResponseOutput.value = null;
  webhookResponseStatus.value = null;
};

const executeWebhook = async () => {
  webhookLoading.value = true;
  webhookResponseOutput.value = null;
  webhookResponseStatus.value = null;
  try {
    const config = webhookTemplates[selectedWebhookType.value];
    const res = await fetch(config.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: webhookRequestBody.value,
    });
    webhookResponseStatus.value = res.status;
    const json = await res.json();
    webhookResponseOutput.value = json;
    await fetchWebhookHistory();
    await fetchAdminData();
  } catch (err: any) {
    webhookResponseStatus.value = 500;
    webhookResponseOutput.value = { error: err.message };
  } finally {
    webhookLoading.value = false;
  }
};

const fetchWebhookHistory = async () => {
  try {
    const res = await fetch('/api/webhooks/pawapay/history', { credentials: 'include' });
    const json = await res.json();
    if (json.success) webhookHistory.value = json.data || [];
  } catch {}
};

// Cosmos DB Explorer methods
const fetchContainerData = async () => {
  containerLoading.value = true;
  try {
    if (selectedContainer.value === 'loans') {
      const res = await fetch('/api/loans/list', { credentials: 'include' });
      const json = await res.json();
      containerData.value = json.data || [];
    } else if (selectedContainer.value === 'users') {
      const res = await fetch('/api/users/list', { credentials: 'include' });
      const json = await res.json();
      containerData.value = json.data || [];
    } else if (selectedContainer.value === 'pawapay_webhooks') {
      const res = await fetch('/api/webhooks/pawapay/history', { credentials: 'include' });
      const json = await res.json();
      containerData.value = json.data || [];
    } else if (selectedContainer.value === 'audit_logs') {
      const res = await fetch('/api/staff/audit-trail?limit=30', { credentials: 'include' });
      const json = await res.json();
      containerData.value = json.data || [];
    }
  } catch {
    containerData.value = [];
  } finally {
    containerLoading.value = false;
  }
};

// API Console methods
const filteredEndpoints = computed(() => {
  if (selectedTag.value === 'All') return ENDPOINTS_CATALOG;
  return ENDPOINTS_CATALOG.filter((e) => e.tag === selectedTag.value);
});

const selectEndpoint = (ep: ApiDocEndpoint) => {
  selectedEndpoint.value = ep;
  requestBody.value = ep.bodySample ? JSON.stringify(ep.bodySample, null, 2) : '';
  apiResponseOutput.value = null;
  apiResponseStatus.value = null;
  apiResponseHeaders.value = {};
};

const executeApiRequest = async () => {
  apiLoading.value = true;
  apiResponseOutput.value = null;
  apiResponseStatus.value = null;
  try {
    const options: RequestInit = {
      method: selectedEndpoint.value.method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
    };
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedEndpoint.value.method) && requestBody.value) {
      options.body = requestBody.value;
    }
    const res = await fetch(selectedEndpoint.value.path, options);
    apiResponseStatus.value = res.status;
    const contentType = res.headers.get('content-type') || '';
    apiResponseOutput.value = contentType.includes('application/json') ? await res.json() : await res.text();
  } catch (err: any) {
    apiResponseStatus.value = 500;
    apiResponseOutput.value = { error: err.message };
  } finally {
    apiLoading.value = false;
  }
};

const copyCurl = () => {
  const curl = `curl -X ${selectedEndpoint.value.method} "http://localhost:3000${selectedEndpoint.value.path}" \\
  -H "Content-Type: application/json" ${selectedEndpoint.value.bodySample ? `\\\n  -d '${requestBody.value.replace(/\n/g, '').replace(/\s+/g, ' ')}'` : ''}`;
  navigator.clipboard.writeText(curl);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

onMounted(() => {
  setWebhookType('deposit');
  fetchAdminData();
  fetchWebhookHistory();
  quickLogin('Root', 'root@compinance.co.ke');
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
    <!-- Top Header Bar -->
    <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck class="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-xl tracking-tight text-white">Compinance</span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PawaPay M-Pesa
              </span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Azure Cosmos DB
              </span>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Cloudflare Workers
              </span>
            </div>
            <p class="text-xs text-slate-400 hidden sm:block">
              Full-Stack Microfinance Platform • 4 PawaPay Webhooks • Gemini Anti-Fraud • Vue 3 TS Admin Panel
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <div class="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span class="text-slate-500">Active Role:</span>
            <span class="font-mono font-semibold text-emerald-400">{{ activeRoleSession }}</span>
          </div>

          <a
            href="/doc/spec"
            target="_blank"
            rel="noreferrer"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition"
          >
            <span>OpenAPI Spec</span>
            <ExternalLink class="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </header>

    <!-- Navigation & Role Impersonator Bar -->
    <section class="border-b border-slate-800/80 bg-slate-900/40 px-4 py-2.5">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            @click="activeMainTab = 'admin'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2',
              activeMainTab === 'admin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            <Briefcase class="w-3.5 h-3.5" />
            <span>Executive Admin Panel</span>
          </button>
          <button
            @click="activeMainTab = 'webhooks'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2',
              activeMainTab === 'webhooks' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            <Radio class="w-3.5 h-3.5" />
            <span>PawaPay Webhooks (4 Endpoints)</span>
          </button>
          <button
            @click="activeMainTab = 'api'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2',
              activeMainTab === 'api' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            <BookOpen class="w-3.5 h-3.5" />
            <span>API & Docs Console</span>
          </button>
          <button
            @click="() => { activeMainTab = 'cosmos'; fetchContainerData(); }"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2',
              activeMainTab === 'cosmos' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            <Database class="w-3.5 h-3.5 text-blue-300" />
            <span>Azure Cosmos DB Explorer</span>
          </button>
        </div>

        <!-- Quick Role Switcher -->
        <div class="flex items-center gap-1 text-[11px]">
          <span class="text-slate-500 font-semibold mr-1">Switch Role:</span>
          <button
            v-for="r in [
              { label: 'Care (L1)', email: 'care@compinance.co.ke' },
              { label: 'Manager (L2)', email: 'manager@compinance.co.ke' },
              { label: 'Admin (L3)', email: 'admin@compinance.co.ke' },
              { label: 'CEO (L4)', email: 'ceo@compinance.co.ke' },
              { label: 'Root (L5)', email: 'root@compinance.co.ke' },
            ]"
            :key="r.label"
            @click="quickLogin(r.label, r.email)"
            class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
          >
            {{ r.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- Notification Toast / Banner -->
    <div v-if="adminMessage" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
      <div
        :class="[
          'p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between shadow-lg',
          adminMessageType === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        ]"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="adminMessageType === 'success'" class="w-4 h-4 text-emerald-400" />
          <AlertTriangle v-else class="w-4 h-4 text-rose-400" />
          <span>{{ adminMessage }}</span>
        </div>
        <button @click="adminMessage = null" class="text-slate-400 hover:text-white">✕</button>
      </div>
    </div>

    <!-- VIEW 1: EXECUTIVE ADMIN PANEL -->
    <main v-if="activeMainTab === 'admin'" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
      <!-- Floating Financial & Liquidity KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total Disbursed</div>
          <div class="text-2xl font-extrabold text-white font-mono mt-1">
            KES {{ inventoryStats.totalDisbursedKes?.toLocaleString() }}
          </div>
          <div class="text-[11px] text-slate-500 mt-1">Via PawaPay M-Pesa B2C</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total Collected</div>
          <div class="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            KES {{ inventoryStats.totalCollectedKes?.toLocaleString() }}
          </div>
          <div class="text-[11px] text-slate-500 mt-1">C2B STK push repayments</div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">PawaPay Float Liquidity</div>
          <div class="text-2xl font-extrabold text-blue-400 font-mono mt-1">
            KES {{ inventoryStats.companyFloatBalanceKes?.toLocaleString() }}
          </div>
          <div class="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
            <span>Floor: KES {{ inventoryStats.companyReserveFloorKes?.toLocaleString() }}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Solvent</span>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Default Rate / Active</div>
          <div class="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {{ inventoryStats.defaultRatePercent }}%
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            Active Loans: {{ inventoryStats.activeCount }} | Defaulted: {{ inventoryStats.defaultedCount }}
          </div>
        </div>
      </div>

      <!-- Admin Sub-navigation Header -->
      <div class="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div class="flex gap-2">
          <button
            @click="activeAdminSubTab = 'loans'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeAdminSubTab === 'loans' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Loan Approvals & Float Check ({{ loansList.length }})
          </button>
          <button
            @click="activeAdminSubTab = 'kyc'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeAdminSubTab === 'kyc' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Student KYC & Anti-Fraud ({{ studentsList.length }})
          </button>
          <button
            @click="activeAdminSubTab = 'staff'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeAdminSubTab === 'staff' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Staff RBAC & Governance ({{ staffList.length }})
          </button>
          <button
            @click="activeAdminSubTab = 'collections'"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition',
              activeAdminSubTab === 'collections' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Default Collections
          </button>
        </div>

        <button @click="fetchAdminData" class="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <RefreshCw :class="['w-3.5 h-3.5', adminLoading ? 'animate-spin' : '']" /> Refresh Records
        </button>
      </div>

      <!-- SUB-TAB 1: LOAN APPROVALS -->
      <div v-if="activeAdminSubTab === 'loans'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white">Student Loan Portfolio & Float Clearance</h3>
            <p class="text-xs text-slate-400">Verifies company PawaPay float before disbursal to prevent empty mobile money transactions.</p>
          </div>
        </div>

        <div v-if="loansList.length === 0" class="text-center py-12 text-xs text-slate-500 font-mono">
          No student loan applications on record.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="p-3">Loan ID</th>
                <th class="p-3">Student Name</th>
                <th class="p-3">Phone</th>
                <th class="p-3">Principal</th>
                <th class="p-3">Total Due</th>
                <th class="p-3">Paid</th>
                <th class="p-3">Status</th>
                <th class="p-3">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 font-mono">
              <tr v-for="l in loansList" :key="l.id" class="hover:bg-slate-950/40">
                <td class="p-3 font-semibold text-slate-200">{{ l.id }}</td>
                <td class="p-3 font-sans font-medium text-white">{{ l.studentName }}</td>
                <td class="p-3 text-slate-400">{{ l.studentPhone }}</td>
                <td class="p-3 text-emerald-400 font-bold">KES {{ l.amount?.toLocaleString() }}</td>
                <td class="p-3 font-bold">KES {{ l.totalPayable?.toLocaleString() }}</td>
                <td class="p-3 text-emerald-300">KES {{ l.amountPaid?.toLocaleString() || 0 }}</td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                      l.status === 'disbursed' || l.status === 'active'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : l.status === 'repaid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : l.status === 'defaulted'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    ]"
                  >
                    {{ l.status }}
                  </span>
                </td>
                <td class="p-3 font-sans">
                  <button
                    v-if="l.status === 'requested'"
                    @click="approveLoan(l.id)"
                    class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    Check Float & Disburse
                  </button>
                  <span v-else class="text-slate-500 text-xs">Processed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SUB-TAB 2: STUDENT KYC & FORENSIC ANTI-FRAUD -->
      <div v-else-if="activeAdminSubTab === 'kyc'" class="space-y-6">
        <!-- Manual Loan Allocation Limit Tool -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 class="text-base font-bold text-white mb-1">Manually Insert / Set Student Loan Limit</h3>
          <p class="text-xs text-slate-400 mb-4">
            Compinance staff manually assigns the maximum borrowing limit for an individual student (first-time default is KES 30).
          </p>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="block text-slate-400 mb-1">Select Student</label>
              <select v-model="setLimitUserId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                <option value="">-- Choose Student --</option>
                <option v-for="s in studentsList" :key="s.id" :value="s.id">
                  {{ s.fullName }} (Limit: KES {{ s.loanLimit || 30 }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">New Allocation Limit (KES)</label>
              <input type="number" min="20" max="50000" v-model="setLimitAmount" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono" />
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Reason / Note</label>
              <input type="text" v-model="setLimitReason" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div class="self-end">
              <button @click="saveLoanLimit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition">
                Set Limit Allocation
              </button>
            </div>
          </div>
        </div>

        <!-- Student Verification Queue -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-white">Student KYC Documents & Gemini Forensic Anti-Fraud Queue</h3>
          </div>

          <div class="space-y-4">
            <div v-for="u in studentsList" :key="u.id" class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-white">{{ u.fullName }}</span>
                    <span
                      v-if="u.isDefaulter"
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    >
                      Defaulter Flagged
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                      Limit: KES {{ u.loanLimit || 30 }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-400 font-mono mt-0.5">
                    Email: {{ u.email }} | Phone: {{ u.phone }} | Parent: {{ u.parentPhone || 'Not submitted' }} | National ID: {{ u.nationalIdNumber || 'Pending OCR' }}
                  </div>
                </div>

                <span
                  :class="[
                    'text-xs px-2.5 py-0.5 rounded-full uppercase font-bold border',
                    u.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  ]"
                >
                  {{ u.status }}
                </span>
              </div>

              <!-- Forensic Rules Indicators -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span>
                  <span>1 Account per ID</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span>
                  <span>1 Account per Phone</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span>
                  <span>Peer-Parent Blocked</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-emerald-400">✓</span>
                  <span>Self-Parenting Blocked</span>
                </div>
              </div>

              <!-- Actions Bar -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900">
                <button
                  v-if="u.parentPhone"
                  @click="triggerParentChallenge(u.id)"
                  class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                >
                  <Send class="w-3 h-3 text-amber-400" /> Send Parent Challenge OTP
                </button>
                <template v-if="u.status !== 'approved'">
                  <button
                    @click="approveKyc(u.id, true)"
                    class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <CheckCircle2 class="w-3 h-3" /> Approve Account (Manager+)
                  </button>
                  <button
                    @click="approveKyc(u.id, false)"
                    class="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <XCircle class="w-3 h-3" /> Reject
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 3: STAFF RBAC & GOVERNANCE -->
      <div v-else-if="activeAdminSubTab === 'staff'" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Visible Staff List (obeying hierarchy rule) -->
        <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 class="text-base font-bold text-white">Staff Hierarchy Directory</h3>
            <p class="text-xs text-slate-400 mt-1">
              Currently acting as <strong>{{ activeRoleSession }}</strong>. By microfinance governance, you can only view staff with strictly lower roles than yours.
            </p>
          </div>

          <div class="space-y-3">
            <div v-for="s in staffList" :key="s.id" class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">{{ s.fullName }}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    {{ s.role }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">{{ s.email }} | {{ s.phone }}</div>
                <div v-if="s.duties && Object.keys(s.duties).length > 0" class="text-[10px] text-amber-400 mt-1">
                  Duties: {{ JSON.stringify(s.duties) }}
                </div>
              </div>

              <div>
                <button
                  v-if="currentCallerRole === 'root' || (currentCallerRole === 'ceo' && s.role !== 'manager' && s.role !== 'ceo' && s.role !== 'root')"
                  @click="deleteStaffMember(s.id)"
                  class="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="De-provision staff"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Provisioning & Executive Duties -->
        <div class="lg:col-span-5 space-y-6">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold text-white">Provision Staff Member</h3>
            <p class="text-[11px] text-slate-400">Only Root & CEO can create staff. CEO cannot create Credit Managers. 1 CEO max.</p>

            <form @submit.prevent="createStaffMember" class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-400 mb-1">Full Name</label>
                <input v-model="newStaffName" required type="text" placeholder="e.g. Samuel Mutiso" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Email</label>
                <input v-model="newStaffEmail" required type="email" placeholder="samuel@compinance.co.ke" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Phone</label>
                <input v-model="newStaffPhone" required type="text" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Target Role</label>
                <select v-model="newStaffRole" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                  <option value="customer_care">Customer Care (L1)</option>
                  <option value="manager">Credit Manager (L2 - Root only)</option>
                  <option value="admin">System Admin (L3)</option>
                  <option value="ceo">CEO (L4 - Root only, 1 max)</option>
                </select>
              </div>
              <button type="submit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition">
                Provision Staff Account
              </button>
            </form>
          </div>

          <!-- Executive Duties Assignment -->
          <div v-if="currentCallerRole === 'ceo' || currentCallerRole === 'root'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 class="text-base font-bold text-white">Executive Duty Assignment</h3>
            <p class="text-[11px] text-slate-400">Grant special duties to Customer Care staff.</p>

            <div class="space-y-3 text-xs">
              <select v-model="selectedDutyStaffId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
                <option value="">-- Select Staff --</option>
                <option v-for="s in staffList" :key="s.id" :value="s.id">
                  {{ s.fullName }} ({{ s.role }})
                </option>
              </select>

              <div class="space-y-1 text-slate-300">
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="dutyApproveLoans" class="rounded border-slate-800 text-emerald-500" />
                  <span>Can Approve Loans</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="dutyVerifyKYC" class="rounded border-slate-800 text-emerald-500" />
                  <span>Can Verify KYC</span>
                </label>
              </div>

              <button @click="assignExecutiveDuties" class="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition">
                Assign Duties
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SUB-TAB 4: DEFAULT COLLECTIONS -->
      <div v-else-if="activeAdminSubTab === 'collections'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 class="text-base font-bold text-white">Assign Defaulted Loan Recovery</h3>
          <p class="text-xs text-slate-400">CEO or Root assigns defaulted accounts to recovery collection officers.</p>
        </div>

        <div class="flex flex-wrap gap-3 text-xs">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-slate-400 mb-1">Select Loan</label>
            <select v-model="assignLoanId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
              <option value="">-- Choose Loan --</option>
              <option v-for="l in loansList" :key="l.id" :value="l.id">
                {{ l.id }} - {{ l.studentName }} (KES {{ l.totalPayable?.toLocaleString() }} - {{ l.status }})
              </option>
            </select>
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-slate-400 mb-1">Assign Collector Officer</label>
            <select v-model="assignCollectorId" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white">
              <option value="">-- Choose Collector --</option>
              <option v-for="s in staffList" :key="s.id" :value="s.id">
                {{ s.fullName }} ({{ s.role }})
              </option>
            </select>
          </div>

          <div class="self-end">
            <button @click="assignCollectionOfficer" class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition">
              Assign Collector
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- VIEW 2: PAWAPAY WEBHOOKS SUITE -->
    <main v-else-if="activeMainTab === 'webhooks'" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="flex items-center gap-2">
              <Radio class="w-5 h-5 text-emerald-400 animate-pulse" />
              <h2 class="text-xl font-extrabold text-white">PawaPay Official Webhook Callbacks Suite</h2>
            </div>
            <p class="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Real-time asynchronous notification endpoints according to PawaPay mobile money API specifications.
              Persisted with high availability into <strong>Azure Cosmos DB</strong> (<code>pawapay_webhooks</code> container).
            </p>
          </div>
          <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold rounded-lg border border-emerald-500/30">
            4 Active Webhook Endpoints
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <button
            @click="setWebhookType('deposit')"
            :class="[
              'p-4 rounded-xl border text-left transition',
              selectedWebhookType === 'deposit'
                ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">POST</span>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">C2B Pay-In</span>
            </div>
            <div class="font-bold text-sm text-white mt-1">1. Deposits Callback</div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5">/api/webhooks/pawapay/deposits</div>
          </button>

          <button
            @click="setWebhookType('payout')"
            :class="[
              'p-4 rounded-xl border text-left transition',
              selectedWebhookType === 'payout'
                ? 'bg-slate-800 border-blue-500 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">POST</span>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">B2C Pay-Out</span>
            </div>
            <div class="font-bold text-sm text-white mt-1">2. Payouts Callback</div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5">/api/webhooks/pawapay/payouts</div>
          </button>

          <button
            @click="setWebhookType('refund')"
            :class="[
              'p-4 rounded-xl border text-left transition',
              selectedWebhookType === 'refund'
                ? 'bg-slate-800 border-purple-500 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">POST</span>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Reversals</span>
            </div>
            <div class="font-bold text-sm text-white mt-1">3. Refunds Callback</div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5">/api/webhooks/pawapay/refunds</div>
          </button>

          <button
            @click="setWebhookType('float')"
            :class="[
              'p-4 rounded-xl border text-left transition',
              selectedWebhookType === 'float'
                ? 'bg-slate-800 border-amber-500 text-white shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">POST</span>
              <span class="text-[10px] text-slate-400 uppercase font-semibold">Reserve Floor</span>
            </div>
            <div class="font-bold text-sm text-white mt-1">4. Float Alerts</div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5">/api/webhooks/pawapay/float-notifications</div>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-emerald-400 uppercase">{{ webhookTemplates[selectedWebhookType].title }}</span>
              <span class="text-xs font-mono text-slate-400">{{ webhookTemplates[selectedWebhookType].path }}</span>
            </div>
            <p class="text-xs text-slate-300 mt-1">{{ webhookTemplates[selectedWebhookType].description }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span class="font-semibold uppercase tracking-wider text-[10px]">PawaPay Event JSON Payload</span>
              <span class="text-slate-500">Edit payload fields to test edge cases</span>
            </div>
            <textarea
              v-model="webhookRequestBody"
              rows="10"
              class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 shadow-inner"
            ></textarea>
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <button @click="setWebhookType(selectedWebhookType)" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition">
              Reset Sample
            </button>
            <button
              @click="executeWebhook"
              :disabled="webhookLoading"
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Send class="w-3.5 h-3.5" />
              <span>{{ webhookLoading ? 'Dispatching Webhook...' : 'Fire Live PawaPay Webhook' }}</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Terminal class="w-4 h-4 text-emerald-400" />
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">Compinance Webhook Response</h3>
            </div>
            <span
              v-if="webhookResponseStatus !== null"
              :class="[
                'px-2.5 py-0.5 rounded font-mono text-xs font-bold border',
                webhookResponseStatus === 200 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              ]"
            >
              HTTP {{ webhookResponseStatus }}
            </span>
          </div>

          <div class="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl p-4 overflow-x-auto shadow-inner">
            <pre v-if="webhookResponseOutput" class="text-xs font-mono text-emerald-300">{{ JSON.stringify(webhookResponseOutput, null, 2) }}</pre>
            <div v-else class="text-center py-14 text-xs text-slate-500">
              Click <strong>"Fire Live PawaPay Webhook"</strong> to test callbacks.
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- VIEW 3: API & DOCS EXPLORER -->
    <main v-else-if="activeMainTab === 'api'" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside class="lg:col-span-4 space-y-4">
        <div class="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            v-for="t in tags"
            :key="t"
            @click="selectedTag = t"
            :class="[
              'px-2.5 py-1 text-xs font-semibold rounded-lg transition',
              selectedTag === t ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ t }}
          </button>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 max-h-[calc(100vh-220px)] overflow-y-auto space-y-1.5">
          <button
            v-for="ep in filteredEndpoints"
            :key="`${ep.method}-${ep.path}`"
            @click="selectEndpoint(ep)"
            :class="[
              'w-full text-left p-2.5 rounded-xl transition flex flex-col gap-1 border',
              selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method
                ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                : 'border-transparent hover:bg-slate-800/50'
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                :class="[
                  'px-2 py-0.5 text-[10px] font-mono font-bold rounded border',
                  ep.method === 'POST' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : ep.method === 'DELETE' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                ]"
              >
                {{ ep.method }}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">{{ ep.auth }}</span>
            </div>
            <div class="text-xs font-semibold text-white truncate">{{ ep.summary }}</div>
            <div class="text-[11px] font-mono text-slate-400 truncate">{{ ep.path }}</div>
          </button>
        </div>
      </aside>

      <section class="lg:col-span-8 space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-3 py-1 text-xs font-mono font-bold rounded-lg border',
                  selectedEndpoint.method === 'POST' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : selectedEndpoint.method === 'DELETE' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                ]"
              >
                {{ selectedEndpoint.method }}
              </span>
              <code class="text-base sm:text-lg font-mono font-bold text-white">{{ selectedEndpoint.path }}</code>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <Lock class="w-3 h-3 text-slate-400" />
              {{ selectedEndpoint.auth }}
            </span>
          </div>

          <div>
            <h2 class="text-lg font-bold text-white">{{ selectedEndpoint.summary }}</h2>
            <p class="text-sm text-slate-300 mt-1 leading-relaxed">{{ selectedEndpoint.description }}</p>
          </div>

          <div v-if="['POST', 'PUT', 'PATCH', 'DELETE'].includes(selectedEndpoint.method)" class="space-y-2 pt-2">
            <textarea v-model="requestBody" rows="6" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 shadow-inner"></textarea>
          </div>

          <div class="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <button
              @click="executeApiRequest"
              :disabled="apiLoading"
              class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Play class="w-3.5 h-3.5 fill-current" />
              <span>{{ apiLoading ? 'Sending Request...' : 'Execute Live Request' }}</span>
            </button>

            <button @click="copyCurl" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5 transition">
              <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copied ? 'cURL Copied!' : 'Copy cURL' }}</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Terminal class="w-4 h-4 text-emerald-400" />
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">Live Response Console</h3>
            </div>
            <span v-if="apiResponseStatus !== null" class="px-2.5 py-0.5 rounded font-mono text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Status: {{ apiResponseStatus }}
            </span>
          </div>

          <pre v-if="apiResponseOutput" class="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 shadow-inner">{{
            typeof apiResponseOutput === 'object' ? JSON.stringify(apiResponseOutput, null, 2) : apiResponseOutput
          }}</pre>
          <div v-else class="bg-slate-950 border border-slate-800/80 rounded-xl p-8 text-center text-xs text-slate-500">
            Click <strong>"Execute Live Request"</strong> above to send request.
          </div>
        </div>
      </section>
    </main>

    <!-- VIEW 4: AZURE COSMOS DB EXPLORER -->
    <main v-else-if="activeMainTab === 'cosmos'" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="flex items-center gap-2">
              <Database class="w-6 h-6 text-blue-400" />
              <h2 class="text-xl font-bold text-white">Azure Cosmos DB Infrastructure</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Document store with high availability, partitioned collections, and automatic failover.
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs font-mono">
            <span class="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30">
              Database: {{ cosmosStatus.databaseId }}
            </span>
            <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
              Status: Connected
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            v-for="cName in ['loans', 'users', 'pawapay_webhooks', 'audit_logs']"
            :key="cName"
            @click="() => { selectedContainer = cName; fetchContainerData(); }"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 border',
              selectedContainer === cName ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
            ]"
          >
            <Layers class="w-3.5 h-3.5" />
            <span>container: {{ cName }}</span>
          </button>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white font-mono">
            Cosmos Query: SELECT * FROM c IN {{ selectedContainer }} ({{ containerData.length }} records)
          </h3>
          <button @click="fetchContainerData" class="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
            <RefreshCw class="w-3.5 h-3.5" /> Refresh Documents
          </button>
        </div>

        <div v-if="containerLoading" class="text-center py-12 text-slate-500 text-xs font-mono">
          Querying Azure Cosmos DB...
        </div>

        <div v-else-if="containerData.length === 0" class="text-center py-12 text-slate-500 text-xs font-mono">
          No records currently in container: {{ selectedContainer }}.
        </div>

        <div v-else class="space-y-3">
          <div v-for="(doc, idx) in containerData" :key="doc.id || idx" class="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 hover:border-slate-700 transition">
            <div class="flex items-center justify-between border-b border-slate-900 pb-2">
              <span class="text-emerald-400 font-bold">id: {{ doc.id }}</span>
              <span class="text-slate-500 text-[10px]">partitionKey: {{ doc.id }}</span>
            </div>
            <pre class="text-slate-300 text-[11px] overflow-x-auto">{{ JSON.stringify(doc, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-800 bg-slate-900/60 px-4 py-4 text-xs text-slate-500 text-center">
      Compinance Fintech Platform • Vue 3 TS Admin Panel • Azure Cosmos DB • PawaPay Mobile Money Webhooks • Cloudflare Workers Deployable
    </footer>
  </div>
</template>
