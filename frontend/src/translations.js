export const TRANSLATIONS = {
  en: {
    // Header
    appTitle: 'FRAUD SHIELD',
    appSubtitle: 'real-time transaction risk console',
    liveFeed: 'LIVE FEED',
    disconnected: 'DISCONNECTED',
    themeDark: 'Dark',
    themeLight: 'Light',
    notifications: 'Alerts',
    clearAlerts: 'Clear all',
    noAlerts: 'No flagged alerts',
    menu: 'Menu',

    // Navigation
    navLiveConsole: 'Live Console',
    navConfidenceFlow: 'Confidence Flow',
    navAnalytics: 'Analytics',
    navInsights: 'Model Insights',
    navHistory: 'History',
    inclusionBadge: 'Inclusion',

    // Stat Cards
    totalScored: 'Total scored',
    flagged: 'Flagged',
    avgRisk: 'Avg risk',
    fraudRate: 'Fraud rate',
    allTime: 'all time',
    thisSession: 'this session',
    rollingWindow: 'rolling window',
    serverWide: 'server-wide',

    // Ledger
    ledgerTitle: 'TRANSACTION LEDGER',
    scoredCount: 'scored',
    colId: 'ID',
    colRisk: 'RISK',
    colSignal: 'SIGNAL',
    colScore: 'SCORE',
    colAmount: 'AMOUNT',
    waitingTxns: 'Waiting for transactions to stream in…',

    // Action Bar
    btnPause: 'Pause',
    btnResume: 'Resume',
    btnSimulate: 'Simulate',
    btnClear: 'Clear',
    btnExportCsv: 'Export Excel',
    searchPlaceholder: 'Filter by ID or keyword…',
    filterAll: 'All',

    // Explainability
    explainHeading: 'EXPLAINABILITY',
    selectTxnPrompt: 'Select a transaction from the ledger to inspect its risk factors.',
    lblTxn: 'Transaction',
    lblFraudProb: 'Fraud probability',
    lblAnomalyScore: 'Anomaly score',
    ctaConfidenceBtn: '🛡️ Test in Customer Confidence Flow',
    ctaConfidenceSub: 'See how this risk is explained to an underserved user',

    // Analytics
    chartRiskDist: 'RISK LEVEL DISTRIBUTION',
    chartAmountBuckets: 'TRANSACTION AMOUNT BUCKETS',
    chartAmountVsRisk: 'AMOUNT VS RISK SCORE',
    axisAmount: 'Amount',
    axisRisk: 'Risk',
    waitingToPlot: 'Waiting for transactions to plot…',

    // Risk Levels
    riskLow: 'Low',
    riskMedium: 'Medium',
    riskHigh: 'High',
    riskCritical: 'Critical',
  },

  ur: {
    // Header
    appTitle: 'فراڈ شیلڈ',
    appSubtitle: 'ریئل ٹائم ٹرانزیکشن رسک مانیٹر',
    liveFeed: 'لائیو فیڈ',
    disconnected: 'منقطع',
    themeDark: 'ڈارک',
    themeLight: 'لائٹ',
    notifications: 'الرٹس',
    clearAlerts: 'سب صاف کریں',
    noAlerts: 'کوئی مشکوک الرٹ نہیں',
    menu: 'مینیو',

    // Navigation
    navLiveConsole: 'لائیو کنسول',
    navConfidenceFlow: 'اعتمادی فلو',
    navAnalytics: 'تجزیات',
    navInsights: 'ماڈل تفصیلات',
    navHistory: 'تاریخچہ',
    inclusionBadge: 'شمولیت',

    // Stat Cards
    totalScored: 'کل جانچ شدہ',
    flagged: 'مشکوک نشان زدہ',
    avgRisk: 'اوسط خطرہ',
    fraudRate: 'دھوکہ دہی کی شرح',
    allTime: 'شروع سے اب تک',
    thisSession: 'موجودہ سیشن',
    rollingWindow: 'حالیہ اوسط',
    serverWide: 'سرور بھر میں',

    // Ledger
    ledgerTitle: 'ٹرانزیکشن لیجر',
    scoredCount: 'جانچے گئے',
    colId: 'شناخت',
    colRisk: 'خطرہ',
    colSignal: 'سگنل',
    colScore: 'اسکور',
    colAmount: 'رقم',
    waitingTxns: 'ٹرانزیکشنز کا انتظار ہے…',

    // Action Bar
    btnPause: 'روکیں',
    btnResume: 'جاری رکھیں',
    btnSimulate: 'فرضی ٹرانزیکشن',
    btnClear: 'صاف کریں',
    btnExportCsv: 'ایکسل برآمد کریں',
    searchPlaceholder: 'آئی ڈی یا لفظ سے تلاش کریں…',
    filterAll: 'سب',

    // Explainability
    explainHeading: 'فیصلے کی وجوہات (وضاحت)',
    selectTxnPrompt: 'خطرے کے اسباب دیکھنے کے لیے لیجر سے کوئی ٹرانزیکشن منتخب کریں۔',
    lblTxn: 'ٹرانزیکشن',
    lblFraudProb: 'فراڈ کا امکان',
    lblAnomalyScore: 'بے قاعدگی کا اسکور',
    ctaConfidenceBtn: '🛡️ کسٹمر اعتمادی فلو میں جانچیں',
    ctaConfidenceSub: 'دیکھیں کہ عام صارف کے لیے یہ خطرہ کیسے واضح کیا جاتا ہے',

    // Analytics
    chartRiskDist: 'خطرے کی سطح کی تقسیم',
    chartAmountBuckets: 'ٹرانزیکشن رقم کے گروپس',
    chartAmountVsRisk: 'رقم بمقابلہ رسک اسکور',
    axisAmount: 'رقم ($)',
    axisRisk: 'رسک اسکور',
    waitingToPlot: 'گراف بنانے کے لیے ٹرانزیکشنز کا انتظار ہے…',

    // Risk Levels
    riskLow: 'محفوظ',
    riskMedium: 'معتدل',
    riskHigh: 'خطرناک',
    riskCritical: 'انتہائی شدید',
  },
};

export function useT(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
