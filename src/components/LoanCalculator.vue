<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Percent,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Info,
  Smartphone,
  TrendingUp,
} from 'lucide-vue-next';

interface LoanQuotation {
  amount: number;
  duration: number;
  interestRate: number; // e.g., 0.05 (5%)
  feeAmount: number;
  totalPayable: number;
  dueDate: Date;
  dailyRate: number;
  apr: number; // Annualized Percentage Rate
  schedule: Array<{
    title: string;
    date: Date;
    amountDue: number;
    description: string;
  }>;
}

const props = withDefaults(
  defineProps<{
    initialAmount?: number;
    initialDuration?: number;
    minAmount?: number;
    maxLimit?: number;
    showProceedButton?: boolean;
    proceedButtonLabel?: string;
    compact?: boolean;
  }>(),
  {
    initialAmount: 30, // Default first-time student loan is strictly KES 30
    initialDuration: 14,
    minAmount: 20,
    maxLimit: 30,
    showProceedButton: true,
    proceedButtonLabel: 'Apply with this Quotation',
    compact: false,
  }
);

const emit = defineEmits<{
  (e: 'update:amount', value: number): void;
  (e: 'update:duration', value: number): void;
  (e: 'change', quotation: LoanQuotation): void;
  (e: 'proceed', quotation: LoanQuotation): void;
}>();

// Sliders State
const amount = ref<number>(Math.min(props.initialAmount, props.maxLimit));
const duration = ref<number>(props.initialDuration);

// Watch for external maxLimit changes (e.g. student qualification upgrade)
watch(
  () => props.maxLimit,
  (newMax) => {
    if (amount.value > newMax) {
      amount.value = newMax;
    }
  }
);

// Dynamic Interest & Fee Calculation
// Microfinance model: 5% flat fee for <= 14 days, 7.5% for 21 days, 10% for 28 days
const interestRate = computed(() => {
  if (duration.value <= 14) return 0.05;
  if (duration.value <= 21) return 0.075;
  return 0.1;
});

const feeAmount = computed(() => {
  return Math.round(amount.value * interestRate.value * 100) / 100;
});

const totalPayable = computed(() => {
  return amount.value + feeAmount.value;
});

const dueDate = computed(() => {
  return new Date(Date.now() + duration.value * 86400000);
});

const dailyRate = computed(() => {
  return totalPayable.value / duration.value;
});

const apr = computed(() => {
  return Math.round((interestRate.value * (365 / duration.value)) * 1000) / 10;
});

// Detailed Repayment Schedule Milestones
const schedule = computed(() => {
  const now = Date.now();
  const milestones = [
    {
      title: 'Disbursement to M-Pesa',
      date: new Date(now),
      amountDue: 0,
      description: `Instant payout of KES ${amount.value}.00 to your Safaricom M-Pesa line via PawaPay.`,
    },
  ];

  if (duration.value >= 14) {
    const midpointDays = Math.floor(duration.value / 2);
    milestones.push({
      title: 'Mid-Term Balance Reminder',
      date: new Date(now + midpointDays * 86400000),
      amountDue: 0,
      description: 'Zero penalty reminder. Optional early repayment earns credit limit bonus.',
    });
  }

  milestones.push({
    title: 'Final Settlement Due',
    date: dueDate.value,
    amountDue: totalPayable.value,
    description: `Full repayment of KES ${totalPayable.value.toFixed(2)} via automated M-Pesa STK push.`,
  });

  return milestones;
});

const quotation = computed<LoanQuotation>(() => ({
  amount: amount.value,
  duration: duration.value,
  interestRate: interestRate.value,
  feeAmount: feeAmount.value,
  totalPayable: totalPayable.value,
  dueDate: dueDate.value,
  dailyRate: dailyRate.value,
  apr: apr.value,
  schedule: schedule.value,
}));

// Emit updates whenever sliders change
watch(
  [amount, duration],
  () => {
    emit('update:amount', amount.value);
    emit('update:duration', duration.value);
    emit('change', quotation.value);
  },
  { immediate: true }
);

function selectPresetAmount(val: number) {
  amount.value = Math.min(val, props.maxLimit);
}

function handleProceed() {
  emit('proceed', quotation.value);
}
</script>

<template>
  <div class="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl text-slate-100 font-sans">
    <!-- Header -->
    <div class="flex items-start justify-between border-b border-slate-800 pb-4">
      <div>
        <div class="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          <TrendingUp class="w-3.5 h-3.5" />
          Interactive Loan Calculator
        </div>
        <h3 class="text-base sm:text-lg font-bold text-white mt-0.5">
          Estimate Interest & Repayment Schedule
        </h3>
        <p class="text-[11px] text-slate-400 mt-0.5">
          Transparent microfinance terms · First-time loan cap is strictly KES 30
        </p>
      </div>

      <div class="text-right font-mono tabular-nums">
        <span class="text-[10px] text-slate-400 font-sans block">Borrowing Cap</span>
        <span class="text-xs sm:text-sm font-bold text-emerald-400">KES {{ maxLimit }}.00</span>
      </div>
    </div>

    <!-- SLIDER 1: LOAN AMOUNT (PRINCIPAL) -->
    <div class="space-y-3">
      <div class="flex justify-between items-baseline font-mono tabular-nums">
        <div>
          <label class="text-xs font-semibold text-slate-200 block font-sans">Principal Amount</label>
          <span class="text-[10px] text-slate-400 font-sans">Slide to adjust emergency float</span>
        </div>
        <div class="text-right">
          <span class="text-2xl sm:text-3xl font-black text-white">KES {{ amount }}</span>
          <span class="text-[10px] text-slate-400 block font-sans">Net M-Pesa Disbursal</span>
        </div>
      </div>

      <!-- Slider Input -->
      <div class="relative py-1">
        <input
          type="range"
          :min="minAmount"
          :max="maxLimit"
          step="5"
          v-model.number="amount"
          class="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-800 focus:outline-none"
        />
        <div class="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5">
          <span>KES {{ minAmount }} (Min)</span>
          <span :class="amount === 30 ? 'text-emerald-400 font-bold' : 'text-slate-400'">
            KES 30 (Standard)
          </span>
          <span>KES {{ maxLimit }} (Max Limit)</span>
        </div>
      </div>

      <!-- Quick Preset Buttons -->
      <div class="grid grid-cols-3 gap-2 pt-1 font-mono tabular-nums">
        <button
          v-for="amt in [20, 30, maxLimit]"
          :key="amt"
          type="button"
          @click="selectPresetAmount(amt)"
          :class="amount === amt ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'"
          class="py-2 px-3 rounded-xl border text-xs transition flex flex-col items-center justify-center font-sans"
        >
          <span class="font-bold font-mono">KES {{ amt }}</span>
          <span class="text-[9px] opacity-75">
            {{ amt === 30 ? 'Standard Default' : amt === 20 ? 'Micro Float' : 'Approved Cap' }}
          </span>
        </button>
      </div>
    </div>

    <!-- SLIDER 2: TENURE / DURATION -->
    <div class="space-y-3 pt-2 border-t border-slate-800/80">
      <div class="flex justify-between items-baseline font-mono tabular-nums">
        <div>
          <label class="text-xs font-semibold text-slate-200 block font-sans">Repayment Tenure</label>
          <span class="text-[10px] text-slate-400 font-sans">Grace window before maturity</span>
        </div>
        <div class="text-right">
          <span class="text-xl sm:text-2xl font-black text-emerald-400">{{ duration }} Days</span>
          <span class="text-[10px] text-slate-400 block font-sans">
            Maturity: {{ dueDate.toLocaleDateString() }}
          </span>
        </div>
      </div>

      <!-- Slider Input -->
      <div class="relative py-1">
        <input
          type="range"
          min="7"
          max="28"
          step="7"
          v-model.number="duration"
          class="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-400 border border-slate-800 focus:outline-none"
        />
        <div class="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5">
          <span>7 Days</span>
          <span>14 Days</span>
          <span>21 Days</span>
          <span>28 Days</span>
        </div>
      </div>
    </div>

    <!-- REAL-TIME UNDERWRITING QUOTATION CARD -->
    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 font-mono tabular-nums">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 font-sans">
        <span class="text-xs font-bold text-white uppercase tracking-wider">Underwriting Quotation</span>
        <span class="text-[10px] text-slate-400">Fixed rate · No compounding</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span class="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Disbursed</span>
          <span class="font-bold text-white text-sm">KES {{ amount }}.00</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Service Fee</span>
          <span class="text-slate-300 text-sm">KES {{ feeAmount.toFixed(2) }} ({{ (interestRate * 100).toFixed(1) }}%)</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Daily Equivalent</span>
          <span class="text-slate-300 text-sm">KES {{ dailyRate.toFixed(2) }}/d</span>
        </div>
        <div>
          <span class="text-[10px] text-emerald-400 uppercase tracking-wider block font-sans font-bold">Total Due</span>
          <span class="font-black text-emerald-400 text-base">KES {{ totalPayable.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Cost Structure Visual Track (Zero Pills) -->
      <div class="pt-2">
        <div class="flex justify-between text-[10px] text-slate-400 font-sans mb-1">
          <span>Principal ({{ Math.round((amount / totalPayable) * 100) }}%)</span>
          <span>Microfinance Fee ({{ Math.round((feeAmount / totalPayable) * 100) }}%)</span>
        </div>
        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
          <div class="bg-emerald-500 h-full" :style="{ width: `${(amount / totalPayable) * 100}%` }"></div>
          <div class="bg-teal-400 h-full" :style="{ width: `${(feeAmount / totalPayable) * 100}%` }"></div>
        </div>
      </div>
    </div>

    <!-- REPAYMENT SCHEDULE TIMELINE (ACCORDION / STEPPER) -->
    <div class="space-y-3 pt-1">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
          <Calendar class="w-3.5 h-3.5 text-teal-400" />
          Estimated Repayment Timeline
        </span>
        <span class="text-[10px] text-slate-500 font-mono">M-Pesa STK Settlement</span>
      </div>

      <div class="space-y-2 text-xs">
        <div
          v-for="(item, idx) in schedule"
          :key="idx"
          class="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
        >
          <div
            :class="idx === schedule.length - 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'"
            class="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono text-[10px]"
          >
            {{ idx + 1 }}
          </div>
          <div class="flex-1 space-y-0.5">
            <div class="flex justify-between items-center font-bold text-white">
              <span>{{ item.title }}</span>
              <span class="font-mono tabular-nums text-emerald-400">
                {{ item.amountDue > 0 ? `KES ${item.amountDue.toFixed(2)}` : 'KES 0.00' }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed font-sans">
              {{ item.description }}
            </p>
            <div class="text-[10px] text-slate-500 font-mono pt-0.5">
              Scheduled Date: {{ item.date.toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PROCEED ACTION BUTTON (When integrated into application flow) -->
    <div v-if="showProceedButton" class="pt-2">
      <button
        type="button"
        @click="handleProceed"
        class="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
      >
        <span>{{ proceedButtonLabel }}</span>
        <ArrowRight class="w-4 h-4" />
      </button>
      <div class="flex items-center justify-between text-[10px] text-slate-500 pt-2 px-1 font-mono">
        <span>Instant PawaPay Disbursal</span>
        <span>·</span>
        <span>APR: {{ apr }}% Annualized</span>
        <span>·</span>
        <span>Zero Hidden Fees</span>
      </div>
    </div>
  </div>
</template>
