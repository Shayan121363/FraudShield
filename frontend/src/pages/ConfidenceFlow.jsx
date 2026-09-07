import { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Link } from 'react-router-dom';

const PRESET_SCENARIOS = [
  {
    id: 'merchant-risk',
    tag_en: 'Unverified Merchant',
    tag_ur: 'غیر مانوس دکان دار',
    title_en: 'Payment to Newly Created Online Store',
    title_ur: 'نئی آن لائن دکان کو ادائیگی',
    transaction: {
      transaction_id: 'INC-7821',
      amount: 450.0,
      hour: 15,
      merchant_risk_score: 0.88,
      distance_from_home_km: 12.0,
      txns_last_24h: 2,
      is_foreign: 0,
      account_age_days: 25.0,
      risk_level: 'high',
      risk_score: 0.72,
      fraud_probability: 0.76,
      anomaly_score: 0.63,
      user_guidance: {
        demographic: 'First-Time Digital Banking & Wallet User',
        plain_title_en: 'Safety Check: Unfamiliar or High-Risk Recipient',
        plain_title_ur: 'حفاظتی تسلی: نیا یا غیر مانوس وصول کنندہ',
        plain_reason_en: 'This payment is directed to a newly registered recipient with an elevated risk rating. Deceptive accounts often pose as online stores.',
        plain_reason_ur: 'یہ رقم ایک ایسے نئے اکاؤنٹ کو بھیجی جا رہی ہے جس کی مکمل تصدیق نہیں ہے۔ دھوکے باز اکثر ایسی دکانیں بنا کر رقم وصول کرتے ہیں۔',
        confidence_verdict_en: 'Take 60 seconds to double-check before releasing your money.',
        confidence_verdict_ur: 'رقم بھیجنے سے پہلے ایک منٹ رک کر تسلی کر لیں۔',
        safety_checklist: [
          {
            id: 'check_scam_promise',
            question_en: 'Did someone promise a prize, lottery, or urgent job offer for this transfer?',
            question_ur: 'کیا کسی نے لاٹری، انعام، نوکری یا فوری منافع کا جھانسہ دے کر یہ رقم مانگی ہے؟',
            tip_en: 'Legitimate services never ask for upfront transfer fees to claim gifts.',
            tip_ur: 'اصلی کمپنیاں تحائف یا انعامات کے بدلے پہلے فیس نہیں مانگتیں۔'
          },
          {
            id: 'check_otp',
            question_en: 'Did anyone on a phone call or SMS ask you to share your secret OTP or PIN?',
            question_ur: 'کیا کسی نے فون پر آپ سے خفیہ ون ٹائم پاس ورڈ (OTP) یا پن مانگا ہے؟',
            tip_en: 'Bank and wallet staff will never ask for your secret code.',
            tip_ur: 'بینک یا والٹ کا کوئی بھی نمائندہ کبھی آپ سے خفیہ پاس ورڈ یا پن نہیں مانگے گا۔'
          }
        ],
        recommended_action_en: 'Verify the merchant official phone number before authorizing.',
        recommended_action_ur: 'پیسے بھیجنے سے پہلے دکان دار کے اصل فون نمبر پر کال کر کے تصدیق کریں۔'
      }
    }
  },
  {
    id: 'large-amount',
    tag_en: 'Unusually Large Amount',
    tag_ur: 'معمول سے بڑی رقم',
    title_en: 'Transfer Exceeding Typical Spending',
    title_ur: 'عام اخراجات سے بڑی رقم کی منتقلی',
    transaction: {
      transaction_id: 'INC-9042',
      amount: 1850.0,
      hour: 11,
      merchant_risk_score: 0.25,
      distance_from_home_km: 4.5,
      txns_last_24h: 1,
      is_foreign: 0,
      account_age_days: 120.0,
      risk_level: 'high',
      risk_score: 0.68,
      fraud_probability: 0.71,
      anomaly_score: 0.61,
      user_guidance: {
        demographic: 'First-Time Digital Banking & Wallet User',
        plain_title_en: 'Safety Check: Substantially Larger Amount Than Usual',
        plain_title_ur: 'حفاظتی تسلی: معمول سے خاصی بڑی رقم',
        plain_reason_en: 'You are transferring $1,850.00, which is significantly higher than your typical transactions. We want to ensure no accidental extra zeroes were typed.',
        plain_reason_ur: 'آپ کی بھیجی جانے والی رقم ($1,850.00) آپ کے عام اخراجات سے خاصی زیادہ ہے۔ ہم تسلی کرنا چاہتے ہیں کہ کہیں غلطی سے اضافی صفر تو نہیں لگ گیا۔',
        confidence_verdict_en: 'Verify the exact digits so you feel completely confident.',
        confidence_verdict_ur: 'ہندسوں کو دوبارہ چیک کر لیں تاکہ آپ مکمل مطمئن رہیں۔',
        safety_checklist: [
          {
            id: 'check_zeroes',
            question_en: 'Did you verify there are no accidental typing mistakes in the amount?',
            question_ur: 'کیا آپ نے تسلی کی ہے کہ رقم لکھتے ہوئے کوئی غلط ہندسہ یا اضافی صفر نہیں لگا؟',
            tip_en: 'Accidental digit slips are the most common source of transfer regret.',
            tip_ur: 'غلطی سے اضافی ہندسہ لکھ دینا ڈیجیٹل ادائیگیوں میں سب سے عام غلطی ہے۔'
          },
          {
            id: 'check_urgency',
            question_en: 'Is someone pressuring you to rush and transfer the money right this second?',
            question_ur: 'کیا کوئی فون یا چیٹ پر آپ پر فوری رقم بھیجنے کا دباؤ ڈال رہا ہے؟',
            tip_en: 'Scammers induce artificial panic. Legitimate payments can always wait 5 minutes.',
            tip_ur: 'دھوکے باز مصنوعی افراتفری پیدا کرتے ہیں۔ حقیقی ادائیگیاں 5 منٹ انتظار کر سکتی ہیں۔'
          }
        ],
        recommended_action_en: 'Confirm the recipient name and amount on an official invoice first.',
        recommended_action_ur: 'پہلے اصل بل یا انوائس پر وصول کنندہ کا نام اور رقم چیک کریں۔'
      }
    }
  },
  {
    id: 'distant-travel',
    tag_en: 'Distant Location',
    tag_ur: 'دور دراز مقام',
    title_en: 'Payment Detected Far From Registered Area',
    title_ur: 'رجسٹرڈ مقام سے دور ادائیگی',
    transaction: {
      transaction_id: 'INC-3319',
      amount: 120.0,
      hour: 22,
      merchant_risk_score: 0.35,
      distance_from_home_km: 380.0,
      txns_last_24h: 3,
      is_foreign: 0,
      account_age_days: 90.0,
      risk_level: 'medium',
      risk_score: 0.46,
      fraud_probability: 0.44,
      anomaly_score: 0.51,
      user_guidance: {
        demographic: 'First-Time Digital Banking & Wallet User',
        plain_title_en: 'Safety Check: Payment Away From Your Usual Area',
        plain_title_ur: 'حفاظتی تسلی: نامانوس مقام سے ادائیگی',
        plain_reason_en: 'This transfer is initiated 380 km away from your regular address. If you are traveling or shopping online, this is totally fine.',
        plain_reason_ur: 'یہ ادائیگی آپ کے معمول کے مقام سے تقریباً 380 کلومیٹر دور سے کی جا رہی ہے۔ اگر آپ سفر کر رہے ہیں تو یہ بالکل ٹھیک ہے۔',
        confidence_verdict_en: 'Just confirm that you are making this transaction yourself.',
        confidence_verdict_ur: 'صرف تصدیق کریں کہ یہ ادائیگی آپ خود کر رہے ہیں۔',
        safety_checklist: [
          {
            id: 'check_travel',
            question_en: 'Are you currently traveling or using an online checkout?',
            question_ur: 'کیا آپ اس وقت سفر میں ہیں یا کسی ویب سائٹ سے آن لائن خریداری کر رہے ہیں؟',
            tip_en: 'Your account automatically learns your normal travel habits.',
            tip_ur: 'آپ کا والٹ آپ کے سفری معمولات کو خود بخود پہچانتا ہے۔'
          },
          {
            id: 'check_possession',
            question_en: 'Do you currently have your payment card and phone in your hands?',
            question_ur: 'کیا آپ کا کارڈ اور موبائل فون آپ کے پاس محفوظ ہیں؟',
            tip_en: 'If either is lost, you can temporarily pause your card in one tap.',
            tip_ur: 'اگر کارڈ گم ہو گیا ہو تو آپ اسے ایک بٹن سے فوری عارضی طور پر روک سکتے ہیں۔'
          }
        ],
        recommended_action_en: 'Authorize if you are present; otherwise freeze the card immediately.',
        recommended_action_ur: 'اگر یہ آپ خود ہیں تو تصدیق کریں۔ ورنہ کارڈ فوری بلاک کریں۔'
      }
    }
  },
  {
    id: 'safe-grocery',
    tag_en: 'Normal Everyday',
    tag_ur: 'معمول کا لین دین',
    title_en: 'Local Supermarket Everyday Purchase',
    title_ur: 'قریبی دکان سے روزمرہ خریداری',
    transaction: {
      transaction_id: 'INC-1055',
      amount: 24.5,
      hour: 13,
      merchant_risk_score: 0.08,
      distance_from_home_km: 1.2,
      txns_last_24h: 1,
      is_foreign: 0,
      account_age_days: 450.0,
      risk_level: 'low',
      risk_score: 0.05,
      fraud_probability: 0.04,
      anomaly_score: 0.07,
      user_guidance: {
        demographic: 'First-Time Digital Banking & Wallet User',
        plain_title_en: 'Payment Looks Normal & Secure',
        plain_title_ur: 'ادائیگی بالکل محفوظ اور درست معلوم ہوتی ہے',
        plain_reason_en: 'Your payment details match your typical everyday routine. No indicators of deceptive activity.',
        plain_reason_ur: 'آپ کی ادائیگی آپ کے روزمرہ اخراجات سے مطابقت رکھتی ہے۔ کسی قسم کا کوئی خطرہ موجود نہیں۔',
        confidence_verdict_en: 'Safe to proceed. Your digital balance and account are protected.',
        confidence_verdict_ur: 'آگے بڑھنا محفوظ ہے۔ آپ کی رقم اور اکاؤنٹ مکمل محفوظ ہیں۔',
        safety_checklist: [
          {
            id: 'check_amt',
            question_en: 'Did you review this amount on the counter / screen?',
            question_ur: 'کیا آپ نے کاؤنٹر یا اسکرین پر رقم دیکھ لی ہے؟',
            tip_en: 'Everything matches your expected local transaction pattern.',
            tip_ur: 'تمام تفصیلات آپ کے معمول کے مطابق ہیں۔'
          }
        ],
        recommended_action_en: 'You can proceed directly with confidence.',
        recommended_action_ur: 'آپ اطمینان کے ساتھ ادائیگی مکمل کر سکتے ہیں۔'
      }
    }
  }
];

export default function ConfidenceFlow() {
  const { selected, lang } = useAppData();
  const [activeScenarioId, setActiveScenarioId] = useState('merchant-risk');
  const [currentStep, setCurrentStep] = useState(1); // 1: Clarify, 2: Guide (Safety Quiz), 3: Action Choice
  const [answers, setAnswers] = useState({});
  const [actionOutcome, setActionOutcome] = useState(null);

  const activeTxn = useMemo(() => {
    if (activeScenarioId === 'live' && selected) {
      return selected;
    }
    const found = PRESET_SCENARIOS.find((s) => s.id === activeScenarioId);
    return found ? found.transaction : PRESET_SCENARIOS[0].transaction;
  }, [activeScenarioId, selected]);

  const guidance = activeTxn.user_guidance || {
    demographic: 'First-Time Digital Banking & Wallet User',
    plain_title_en: 'Payment Verification Check',
    plain_title_ur: 'ادائیگی کی حفاظتی جانچ',
    plain_reason_en: 'We are performing a routine safety check to protect your funds.',
    plain_reason_ur: 'آپ کی رقم کے تحفظ کے لیے معمول کی حفاظتی جانچ کی جا رہی ہے۔',
    confidence_verdict_en: 'Review the details below to ensure peace of mind.',
    confidence_verdict_ur: 'مکمل اطمینان کے لیے درج ذیل تفصیلات کا جائزہ لیں۔',
    safety_checklist: [
      {
        id: 'q1',
        question_en: 'Did you initiate this transaction yourself?',
        question_ur: 'کیا آپ نے یہ لین دین خود شروع کیا ہے؟',
        tip_en: 'Confirm you are the one authorizing this transfer.',
        tip_ur: 'یقینی بنائیں کہ یہ ٹرانسفر آپ خود کر رہے ہیں۔'
      }
    ],
    recommended_action_en: 'Confirm your choice below.',
    recommended_action_ur: 'نیچے اپنے فیصلے کی تصدیق کریں۔'
  };

  const isUrdu = lang === 'ur';

  const handleAnswerToggle = (id, val) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  const handleSelectScenario = (id) => {
    setActiveScenarioId(id);
    setCurrentStep(1);
    setAnswers({});
    setActionOutcome(null);
  };

  const handleAction = (outcomeType) => {
    setActionOutcome(outcomeType);
    setCurrentStep(4); // Completed screen
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setAnswers({});
    setActionOutcome(null);
  };

  return (
    <div className={`confidence-page ${isUrdu ? 'lang-urdu' : ''}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Track Playbook Winning Signal Header */}
      <div className="inclusion-banner">
        <div className="inclusion-banner-content">
          <div className="inclusion-track-badge">
            <span className="sparkle-icon">✨</span>
            <span>TRACK 03: FINANCIAL INCLUSION</span>
          </div>
          <h1 className="inclusion-headline">
            {isUrdu ? 'رسائی کو اعتماد میں بدلیں — محفوظ اور باخبر ڈیجیٹل فیصلے' : 'Turn Access into Confidence — Safe, Informed Financial Choices'}
          </h1>
          <p className="inclusion-subhead">
            {isUrdu ? (
              <>
                <strong>جیتنے کا اصول:</strong> زیادہ لوگ صرف ایک اور ایپ چلانے کے بجائے <em>باخبر اور محفوظ فیصلے</em> کر سکیں، اور بنا خوف ڈیجیٹل بینکنگ اپنائیں۔
              </>
            ) : (
              <>
                <strong>Winning Signal:</strong> More people can make <em>informed choices</em> — not just access another interface.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Scenario Selector Pill Bar */}
      <div className="scenario-toolbar">
        <span className="scenario-label">
          {isUrdu ? 'آزمائشی منظر نامہ منتخب کریں:' : 'Select Simulation Scenario:'}
        </span>
        <div className="scenario-pills">
          {PRESET_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              className={`scenario-pill ${activeScenarioId === sc.id ? 'scenario-pill--active' : ''}`}
              onClick={() => handleSelectScenario(sc.id)}
              type="button"
            >
              <span className="scenario-pill-tag">{isUrdu ? sc.tag_ur : sc.tag_en}</span>
              <span className="scenario-pill-title">{isUrdu ? sc.title_ur : sc.title_en}</span>
            </button>
          ))}

          {selected && (
            <button
              className={`scenario-pill scenario-pill--live ${activeScenarioId === 'live' ? 'scenario-pill--active' : ''}`}
              onClick={() => handleSelectScenario('live')}
              type="button"
            >
              <span className="scenario-pill-tag">🔴 {isUrdu ? 'لائیو فیڈ' : 'Live Feed'}</span>
              <span className="scenario-pill-title">{selected.transaction_id}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Guided Wizard Container */}
      <div className="wizard-container">
        {/* Step Indicator */}
        <div className="wizard-stepper">
          <div className={`step-node ${currentStep >= 1 ? 'step-node--active' : ''} ${currentStep > 1 ? 'step-node--done' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-text">{isUrdu ? 'وضاحت (Clarify)' : '1. Clarify Context'}</span>
          </div>
          <div className={`step-line ${currentStep >= 2 ? 'step-line--active' : ''}`} />
          <div className={`step-node ${currentStep >= 2 ? 'step-node--active' : ''} ${currentStep > 2 ? 'step-node--done' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-text">{isUrdu ? 'رہنمائی (Guide)' : '2. Safety Guide'}</span>
          </div>
          <div className={`step-line ${currentStep >= 3 ? 'step-line--active' : ''}`} />
          <div className={`step-node ${currentStep >= 3 ? 'step-node--active' : ''} ${currentStep > 3 ? 'step-node--done' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-text">{isUrdu ? 'باخبر فیصلہ (Action)' : '3. Informed Choice'}</span>
          </div>
        </div>

        {/* Step 1: Clarify Context & Plain Language Explanation */}
        {currentStep === 1 && (
          <div className="wizard-card animate-fade-in">
            <div className="card-persona-tag">
              <span className="persona-icon">👤</span>
              <span>
                {isUrdu
                  ? 'مخصوص طبقہ: ڈیجیٹل بینکنگ و ای والٹ کے نئے صارفین (کم تجربہ کار)'
                  : 'Underserved Group: First-Time Digital Banking & Mobile Wallet User'}
              </span>
            </div>

            <div className="txn-hero-summary">
              <div className="txn-amount-badge">
                <span className="txn-curr">$</span>
                <span className="txn-val">{activeTxn.amount.toFixed(2)}</span>
              </div>
              <div className="txn-meta-details">
                <span className="txn-id-tag">ID: {activeTxn.transaction_id || 'TXN-NEW'}</span>
                <span className={`risk-pill risk-pill--${activeTxn.risk_level}`}>
                  {isUrdu ? `خطرہ: ${activeTxn.risk_level.toUpperCase()}` : `Risk: ${activeTxn.risk_level.toUpperCase()}`}
                </span>
              </div>
            </div>

            <div className="guidance-callout">
              <div className="callout-icon-shield">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div className="callout-text">
                <h3 className="guidance-title">
                  {isUrdu ? guidance.plain_title_ur : guidance.plain_title_en}
                </h3>
                <p className="guidance-desc">
                  {isUrdu ? guidance.plain_reason_ur : guidance.plain_reason_en}
                </p>
                <p className="guidance-verdict">
                  💡 {isUrdu ? guidance.confidence_verdict_ur : guidance.confidence_verdict_en}
                </p>
              </div>
            </div>

            {/* Why This Matters for Financial Inclusion */}
            <div className="inclusion-note-box">
              <div className="inclusion-note-title">
                {isUrdu ? '✨ یہ روایتی بینکنگ سے کیسے مختلف ہے؟' : '✨ Why this builds confidence over traditional systems:'}
              </div>
              <p className="inclusion-note-text">
                {isUrdu
                  ? 'عام ایپس صارف کو بتائے بغیر ٹرانزیکشن فیل کر دیتی ہیں یا تکنیکی خرابی کا میسج دکھاتی ہیں، جس سے نئے صارفین گھبرا کر ڈیجیٹل والٹ چھوڑ دیتے ہیں۔ فراڈ شیلڈ عام فہم زبان میں اصل وجہ بتاتا ہے تاکہ آپ خود سیکھ کر باخبر فیصلہ کر سکیں۔'
                  : 'Traditional apps silently block payments or show confusing error codes, causing first-time users to panic or abandon digital banking. FraudShield clearly explains the reason in everyday language, putting you in control.'}
              </p>
            </div>

            <div className="wizard-actions">
              <button
                className="btn-wizard-primary"
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                <span>{isUrdu ? 'حفاظتی تصدیق شروع کریں' : 'Continue to Safety Check'}</span>
                <span className="btn-arrow">{isUrdu ? '←' : '→'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Guide - Interactive Safety Check (Confidence Quiz) */}
        {currentStep === 2 && (
          <div className="wizard-card animate-fade-in">
            <div className="card-header-compact">
              <h2 className="step-title">
                {isUrdu ? 'مرحلہ 2: فوری حفاظتی رہنمائی' : 'Step 2: Personalized Safety Check'}
              </h2>
              <p className="step-subtitle">
                {isUrdu
                  ? 'دھوکہ دہی سے بچنے کے لیے درج ذیل 2 سوالات کے جوابات کا جائزہ لیں:'
                  : 'Answer these 2 quick questions tailored to this specific transaction risk:'}
              </p>
            </div>

            <div className="checklist-group">
              {guidance.safety_checklist.map((item, idx) => (
                <div key={item.id} className="checklist-card">
                  <div className="checklist-num">{idx + 1}</div>
                  <div className="checklist-body">
                    <p className="checklist-question">
                      {isUrdu ? item.question_ur : item.question_en}
                    </p>
                    <p className="checklist-tip">
                      🔒 <em>{isUrdu ? item.tip_ur : item.tip_en}</em>
                    </p>
                    <div className="quiz-options">
                      <button
                        className={`quiz-choice-btn ${answers[item.id] === 'no' ? 'quiz-choice-btn--selected-safe' : ''}`}
                        onClick={() => handleAnswerToggle(item.id, 'no')}
                        type="button"
                      >
                        ✓ {isUrdu ? 'نہیں، ایسا کچھ نہیں' : 'No, not at all'}
                      </button>
                      <button
                        className={`quiz-choice-btn ${answers[item.id] === 'yes' ? 'quiz-choice-btn--selected-warn' : ''}`}
                        onClick={() => handleAnswerToggle(item.id, 'yes')}
                        type="button"
                      >
                        ⚠️ {isUrdu ? 'ہاں، مجھے یہ کہا گیا ہے' : 'Yes, someone asked me'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation summary */}
            <div className="recommendation-badge">
              <span className="rec-icon">🎯</span>
              <div>
                <strong>{isUrdu ? 'تجویز کردہ قدم:' : 'Recommended Next Step:'}</strong>{' '}
                <span>{isUrdu ? guidance.recommended_action_ur : guidance.recommended_action_en}</span>
              </div>
            </div>

            <div className="wizard-actions wizard-actions--split">
              <button
                className="btn-wizard-ghost"
                onClick={() => setCurrentStep(1)}
                type="button"
              >
                {isUrdu ? '→ واپس' : '← Back'}
              </button>
              <button
                className="btn-wizard-primary"
                onClick={() => setCurrentStep(3)}
                type="button"
              >
                <span>{isUrdu ? 'باخبر فیصلہ منتخب کریں' : 'Choose Your Action'}</span>
                <span className="btn-arrow">{isUrdu ? '←' : '→'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Informed Action (Empowerment rather than lockout) */}
        {currentStep === 3 && (
          <div className="wizard-card animate-fade-in">
            <div className="card-header-compact">
              <h2 className="step-title">
                {isUrdu ? 'مرحلہ 3: باخبر اور خود مختار فیصلہ' : 'Step 3: Make Your Informed Choice'}
              </h2>
              <p className="step-subtitle">
                {isUrdu
                  ? 'آپ کا اکاؤنٹ، آپ کا اختیار۔ بینک کی جانب سے یکطرفہ پابندی لگانے کے بجائے آپ خود فیصلہ کر سکتے ہیں:'
                  : 'Instead of an abrupt lockout, you are empowered to choose the safest option:'}
              </p>
            </div>

            <div className="action-options-grid">
              {/* Option A: Safe Proceed */}
              <div className="action-choice-card action-choice-card--approve" onClick={() => handleAction('approved')}>
                <div className="action-card-header">
                  <div className="action-icon-circle bg-green">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="action-title">
                      {isUrdu ? 'تسلی ہے، ادائیگی منظور کریں' : 'Authorize & Send Payment'}
                    </h4>
                    <span className="action-tag">
                      {isUrdu ? 'اگر آپ نے تمام معلومات خود چیک کی ہیں' : 'If you verified the recipient yourself'}
                    </span>
                  </div>
                </div>
                <p className="action-desc">
                  {isUrdu
                    ? 'رقم فوری طور پر محفوظ طریقے سے منتقل ہو جائے گی اور آپ کے اکاؤنٹ کی ترجیحات میں یہ وصول کنندہ محفوظ ہو جائے گا۔'
                    : 'Transaction releases securely. Your choice informs the AI model of your trusted merchant preferences.'}
                </p>
                <button className="btn-choice-action btn-choice-action--green" type="button">
                  {isUrdu ? 'ادائیگی بھیجیں' : 'Approve Transfer'}
                </button>
              </div>

              {/* Option B: Pause & Call */}
              <div className="action-choice-card action-choice-card--pause" onClick={() => handleAction('paused')}>
                <div className="action-card-header">
                  <div className="action-icon-circle bg-amber">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="10" y1="15" x2="10" y2="9" />
                      <line x1="14" y1="15" x2="14" y2="9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="action-title">
                      {isUrdu ? '10 منٹ کے لیے روکیں اور تسلی کریں' : 'Pause for 10 Mins & Verify'}
                    </h4>
                    <span className="action-tag">
                      {isUrdu ? 'بہترین انتخاب: شک دور کرنے کے لیے' : 'Recommended: Verify without penalty'}
                    </span>
                  </div>
                </div>
                <p className="action-desc">
                  {isUrdu
                    ? 'ادائیگی 10 منٹ عارضی طور پر ہولڈ رہے گی تاکہ آپ وصول کنندہ یا دکان کے تصدیق شدہ نمبر پر کال کر کے تسلی کر سکیں۔'
                    : 'Holds payment for 10 minutes so you can call the official store number without canceling your order.'}
                </p>
                <button className="btn-choice-action btn-choice-action--amber" type="button">
                  {isUrdu ? 'ادائیگی روک کر تصدیق کریں' : 'Hold & Verify'}
                </button>
              </div>

              {/* Option C: Cancel & Protect */}
              <div className="action-choice-card action-choice-card--cancel" onClick={() => handleAction('cancelled')}>
                <div className="action-card-header">
                  <div className="action-icon-circle bg-red">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="action-title">
                      {isUrdu ? 'ادائیگی منسوخ کریں (کوئی کٹوتی نہیں)' : 'Cancel Transfer Safely'}
                    </h4>
                    <span className="action-tag">
                      {isUrdu ? 'اگر کوئی مشکوک بات نظر آئے' : 'Zero fee, 100% funds retained'}
                    </span>
                  </div>
                </div>
                <p className="action-desc">
                  {isUrdu
                    ? 'رقم فوری واپس آپ کے والٹ میں رہے گی اور کوئی جرمانہ نہیں ہوگا۔ مشکوک وصول کنندہ کو آئندہ کے لیے بلاک کر دیا جائے گا۔'
                    : 'Funds stay safely in your account. The unverified recipient is flagged to prevent future unauthorized requests.'}
                </p>
                <button className="btn-choice-action btn-choice-action--red" type="button">
                  {isUrdu ? 'محفوظ منسوخی' : 'Cancel Safely'}
                </button>
              </div>
            </div>

            <div className="wizard-actions">
              <button
                className="btn-wizard-ghost"
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                {isUrdu ? '→ واپس' : '← Back'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Outcome & Reassurance Receipt */}
        {currentStep === 4 && (
          <div className="wizard-card animate-fade-in">
            <div className="outcome-result-card">
              <div className={`outcome-status-icon outcome-status-icon--${actionOutcome}`}>
                {actionOutcome === 'approved' && '✓'}
                {actionOutcome === 'paused' && '⏸'}
                {actionOutcome === 'cancelled' && '🛡️'}
              </div>

              <h2 className="outcome-title">
                {actionOutcome === 'approved' && (isUrdu ? 'ادائیگی کی توثیق مکمل ہو گئی' : 'Payment Successfully Authorized')}
                {actionOutcome === 'paused' && (isUrdu ? 'ادائیگی 10 منٹ کے لیے روک دی گئی ہے' : 'Payment Temporarily On Hold')}
                {actionOutcome === 'cancelled' && (isUrdu ? 'ادائیگی باحفاظت منسوخ کر دی گئی' : 'Payment Safely Cancelled')}
              </h2>

              <p className="outcome-message">
                {actionOutcome === 'approved' &&
                  (isUrdu
                    ? `آپ نے باخبر تسلی کے بعد $${activeTxn.amount.toFixed(2)} کی ادائیگی جاری کر دی ہے۔ وصول کنندہ کو رقم منتقل کی جا رہی ہے۔`
                    : `You have made an informed decision to authorize $${activeTxn.amount.toFixed(2)}. The funds are being securely transferred.`)}
                {actionOutcome === 'paused' &&
                  (isUrdu
                    ? `آپ کا والٹ $${activeTxn.amount.toFixed(2)} کی رقم کو اگلے 10 منٹ تک روکے رکھے گا۔ آپ تسلی کر کے کسی بھی وقت تصدیق کر سکتے ہیں۔`
                    : `Your transfer of $${activeTxn.amount.toFixed(2)} is on safe hold. You have 10 minutes to verify with the merchant before it releases.`)}
                {actionOutcome === 'cancelled' &&
                  (isUrdu
                    ? `آپ کے پیسے ($${activeTxn.amount.toFixed(2)}) آپ کے اکاؤنٹ میں محفوظ ہیں۔ کوئی کٹوتی یا فیس لاگو نہیں ہوئی ہے۔`
                    : `Your funds ($${activeTxn.amount.toFixed(2)}) remain 100% safe in your balance. No fees were charged.`)}
              </p>

              {/* Confidence Metric & Informed Choice Seal */}
              <div className="confidence-seal">
                <div className="seal-badge">
                  <span className="seal-check">🎖️</span>
                  <div>
                    <div className="seal-title">
                      {isUrdu ? 'باخبر صارف کا محفوظ انتخاب (Informed Choice)' : 'Empowered Financial Choice Recorded'}
                    </div>
                    <div className="seal-desc">
                      {isUrdu
                        ? 'یہ ٹرانزیکشن یکطرفہ تکنیکی پابندی کے بجائے صارف کے شعوری اعتماد سے مکمل کی گئی۔'
                        : 'Completed through user education and confidence rather than opaque black-box rejection.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="outcome-actions">
                <button className="btn-wizard-primary" onClick={resetFlow} type="button">
                  {isUrdu ? 'نیا منظر نامہ آزمائیں' : 'Test Another Scenario'}
                </button>
                <Link to="/" className="btn-wizard-ghost">
                  {isUrdu ? 'اینالسٹ کنسول پر جائیں' : 'Return to Analyst Console'}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pillar 3: Protect - Privacy & Literacy Guarantee Footer */}
        <div className="inclusion-guarantee-card">
          <div className="guarantee-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div className="guarantee-content">
            <h4 className="guarantee-title">
              {isUrdu ? 'فراڈ شیلڈ کا رازداری اور تحفظ کا عہد (Privacy & Safety Guarantee)' : 'FraudShield Privacy & Consent Guarantee'}
            </h4>
            <p className="guarantee-text">
              {isUrdu
                ? 'فراڈ شیلڈ کبھی آپ کا خفیہ لاگ ان، پاس ورڈ، یا ایس ایم ایس پن نہیں مانگے گا۔ ہم آپ کے ڈیٹا کی مکمل رازداری برقرار رکھتے ہیں اور ڈیجیٹل بینکنگ کے ہر قدم پر آپ کو باخبر اور پر اعتماد بناتے ہیں۔'
                : 'FraudShield will never ask for your confidential password, PIN, or OTP. Our system empowers you with understandable insights while preserving total data privacy.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
