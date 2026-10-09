export interface StudyNoteDefinition {
  term: string;
  definition: string;
}

export interface StudyNoteFormula {
  label: string;
  expression: string;
  context: string;
}

export interface StudyNoteWorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface StudyNoteTopic {
  id: string;
  title: string;
  moduleTag: string;
  conceptExplanation: string;
  definitions: StudyNoteDefinition[];
  formulas: StudyNoteFormula[];
  workedExample: StudyNoteWorkedExample;
  revisionPoints: string[];
}

export type SubjectIconKey =
  | 'mathematics'
  | 'physics'
  | 'digital-electronics'
  | 'signals-and-systems'
  | 'control-systems'
  | 'electronic-devices-and-circuits';

export interface StudySubjectCategory {
  slug: string;
  name: string;
  code: string;
  shortDescription: string;
  iconKey: SubjectIconKey;
  pdfUrl: string;
  isSampleResource: boolean;
  topics: StudyNoteTopic[];
}

export const STUDY_NOTES_CATALOG: StudySubjectCategory[] = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    code: 'MA401',
    shortDescription:
      'Linear algebra, eigenvalues, vector calculus, and probability distributions.',
    iconKey: 'mathematics',
    pdfUrl: '/study-notes-pdf/mathematics-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'math-eigenvalues',
        title: 'Eigenvalues, Eigenvectors & Matrix Diagonalization',
        moduleTag: 'Module 1 · Linear Algebra',
        conceptExplanation:
          'An eigenvector of a square matrix A is a non-zero vector v whose direction remains unchanged when A is applied to it, scaled only by a scalar factor λ called the eigenvalue. Diagonalization decomposes A = P D P⁻¹ to simplify matrix powers and coupled differential equations.',
        definitions: [
          {
            term: 'Eigenvalue (λ)',
            definition:
              'A scalar root of the characteristic polynomial det(A − λI) = 0.',
          },
          {
            term: 'Algebraic vs. Geometric Multiplicity',
            definition:
              'Algebraic multiplicity is the root repetition in det(A − λI) = 0; geometric multiplicity is dim(Null(A − λI)).',
          },
          {
            term: 'Diagonalizable Matrix',
            definition:
              'An n × n matrix that possesses n linearly independent eigenvectors.',
          },
        ],
        formulas: [
          {
            label: 'Eigenvalue Equation',
            expression: 'A v = λ v   ⇔   (A − λI) v = 0',
            context: 'Fundamental relation for non-zero eigenvector v.',
          },
          {
            label: 'Characteristic Equation',
            expression: 'det(A − λI) = 0',
            context: 'Used to solve for all eigenvalues λ₁, λ₂, ..., λₙ.',
          },
          {
            label: 'Trace & Determinant Identities',
            expression: 'tr(A) = ∑ λᵢ ,   det(A) = ∏ λᵢ',
            context: 'Quick verification check for computed eigenvalues.',
          },
        ],
        workedExample: {
          problem:
            'Find the eigenvalues of matrix A = [[4, 1], [2, 3]] and verify using trace and determinant.',
          steps: [
            'Form A − λI = [[4 − λ, 1], [2, 3 − λ]].',
            'Compute determinant: (4 − λ)(3 − λ) − (1)(2) = λ² − 7λ + 12 − 2 = λ² − 7λ + 10.',
            'Factor characteristic polynomial: (λ − 5)(λ − 2) = 0 ⇒ λ₁ = 5, λ₂ = 2.',
            'Check: λ₁ + λ₂ = 7 = tr(A) (4 + 3), and λ₁ · λ₂ = 10 = det(A) (12 − 2).',
          ],
          answer: 'λ₁ = 5 and λ₂ = 2',
        },
        revisionPoints: [
          'Real symmetric matrices always have real eigenvalues and orthogonal eigenvectors.',
          'A matrix is invertible if and only if λ = 0 is not an eigenvalue.',
          'Cayley-Hamilton theorem states every square matrix satisfies its own characteristic equation.',
        ],
      },
      {
        id: 'math-bayes-probability',
        title: 'Conditional Probability, Bayes’ Theorem & Random Variables',
        moduleTag: 'Module 2 · Probability & Statistics',
        conceptExplanation:
          'Conditional probability measures the likelihood of an event occurring given prior evidence. Bayes’ Theorem updates prior probabilities into posterior probabilities when new diagnostic or sensor observations arrive.',
        definitions: [
          {
            term: 'Conditional Probability P(A|B)',
            definition:
              'Probability of event A occurring given that event B has already occurred, provided P(B) > 0.',
          },
          {
            term: 'Law of Total Probability',
            definition:
              'Expresses the marginal probability of an outcome across a mutually exclusive and exhaustive partition {B₁, ..., Bₙ}.',
          },
          {
            term: 'Variance Var(X)',
            definition:
              'Expected squared deviation of a random variable X from its mean μ = E[X].',
          },
        ],
        formulas: [
          {
            label: 'Bayes’ Theorem',
            expression: 'P(Bᵢ | A) = [ P(A | Bᵢ) P(Bᵢ) ] / ∑ⱼ P(A | Bⱼ) P(Bⱼ)',
            context: 'Relates posterior probability to likelihood and prior.',
          },
          {
            label: 'Variance Identity',
            expression: 'Var(X) = E[X²] − (E[X])²',
            context: 'Applies to both discrete and continuous random variables.',
          },
        ],
        workedExample: {
          problem:
            'A circuit test detects a defect with 98% sensitivity P(T⁺|D) = 0.98 and has a 2% false-positive rate P(T⁺|Dᶜ) = 0.02. If 5% of boards are defective P(D) = 0.05, find P(D|T⁺).',
          steps: [
            'Prior probabilities: P(D) = 0.05, P(Dᶜ) = 0.95.',
            'Total probability of positive test: P(T⁺) = (0.98)(0.05) + (0.02)(0.95) = 0.049 + 0.019 = 0.068.',
            'Apply Bayes’ Theorem: P(D|T⁺) = 0.049 / 0.068 ≈ 0.7206.',
          ],
          answer: 'P(D|T⁺) = 72.1%',
        },
        revisionPoints: [
          'Independent events satisfy P(A ∩ B) = P(A)P(B); mutually exclusive events with positive probability are never independent.',
          'For independent random variables X and Y, Var(aX + bY) = a²Var(X) + b²Var(Y).',
        ],
      },
    ],
  },
  {
    slug: 'physics',
    name: 'Physics',
    code: 'PH201',
    shortDescription:
      'Electromagnetic wave theory, wave optics, and quantum mechanics fundamentals.',
    iconKey: 'physics',
    pdfUrl: '/study-notes-pdf/physics-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'phys-maxwell-em',
        title: 'Maxwell’s Equations & Electromagnetic Wave Propagation',
        moduleTag: 'Module 1 · Electrodynamics',
        conceptExplanation:
          'Maxwell’s four coupled differential equations unify electricity and magnetism, demonstrating that time-varying electric and magnetic fields sustain each other and propagate through free space at the speed of light.',
        definitions: [
          {
            term: 'Displacement Current Density (J_d)',
            definition:
              'The term ∂D/∂t added by Maxwell to Ampère’s law to ensure charge conservation in time-varying fields.',
          },
          {
            term: 'Poynting Vector (S)',
            definition:
              'Directional energy flux density (W/m²) of an electromagnetic field: S = E × H.',
          },
        ],
        formulas: [
          {
            label: 'Gauss’s Law (Electric & Magnetic)',
            expression: '∇ · D = ρ_v ,   ∇ · B = 0',
            context: 'Electric field diverges from charge; magnetic monopoles do not exist.',
          },
          {
            label: 'Faraday & Ampère-Maxwell Laws',
            expression: '∇ × E = −∂B/∂t ,   ∇ × H = J + ∂D/∂t',
            context: 'Coupled curl equations governing wave propagation.',
          },
          {
            label: 'Wave Speed & Intrinsic Impedance in Vacuum',
            expression: 'c = 1 / √(μ₀ ε₀) ≈ 3 × 10⁸ m/s ,   η₀ = √(μ₀ / ε₀) ≈ 377 Ω',
            context: 'Relates electric and magnetic field amplitudes |E| = η₀ |H|.',
          },
        ],
        workedExample: {
          problem:
            'A plane electromagnetic wave in free space has peak electric field E₀ = 120 V/m. Find the peak magnetic field H₀ and average power density S_avg.',
          steps: [
            'Use free-space intrinsic impedance η₀ = 377 Ω: H₀ = E₀ / η₀ = 120 / 377 ≈ 0.318 A/m.',
            'Compute time-averaged Poynting vector magnitude: S_avg = E₀² / (2 η₀) = 120² / (2 × 377) = 14400 / 754 ≈ 19.1 W/m².',
          ],
          answer: 'H₀ = 0.318 A/m, S_avg = 19.1 W/m²',
        },
        revisionPoints: [
          'In a lossless dielectric medium of relative permittivity ε_r, phase velocity is v_p = c / √ε_r.',
          'Electric field E, magnetic field H, and propagation vector k are mutually perpendicular in a uniform plane wave.',
        ],
      },
      {
        id: 'phys-quantum-wells',
        title: 'De Broglie Matter Waves & 1D Infinite Potential Well',
        moduleTag: 'Module 2 · Quantum Mechanics',
        conceptExplanation:
          'Quantum mechanics models subatomic particles using a complex wave function ψ(x, t) whose squared magnitude |ψ|² gives probability density. Boundary conditions in a confined potential well quantize allowed energy states.',
        definitions: [
          {
            term: 'Wave Function Normalization',
            definition:
              'Condition ∫ |ψ(x)|² dx = 1 ensuring total probability of finding the particle is unity.',
          },
          {
            term: 'Zero-Point Energy (E₁)',
            definition:
              'Lowest possible non-zero energy state (n = 1) of a quantum particle confined in a box.',
          },
        ],
        formulas: [
          {
            label: 'De Broglie Wavelength',
            expression: 'λ = h / p = h / √(2 m E)',
            context: 'Relates particle momentum p to matter-wave wavelength λ.',
          },
          {
            label: 'Quantized Energy in 1D Box of Width L',
            expression: 'Eₙ = (n² h²) / (8 m L²) ,   n = 1, 2, 3, ...',
            context: 'Energy scales quadratically with quantum number n.',
          },
        ],
        workedExample: {
          problem:
            'An electron (m = 9.11 × 10⁻³¹ kg) is confined in a 1D infinite potential well of width L = 0.5 nm. Calculate its ground-state energy E₁ in electron-volts (eV).',
          steps: [
            'Substitute n = 1, h = 6.626 × 10⁻³⁴ J·s, m = 9.11 × 10⁻³¹ kg, L = 5 × 10⁻¹⁰ m.',
            'E₁ = (6.626 × 10⁻³⁴)² / (8 × 9.11 × 10⁻³¹ × 2.5 × 10⁻¹⁹) = 4.39 × 10⁻⁶⁷ / 1.822 × 10⁻⁴⁸ ≈ 2.41 × 10⁻¹⁹ J.',
            'Convert Joules to eV: E₁ = 2.41 × 10⁻¹⁹ / 1.602 × 10⁻¹⁹ ≈ 1.50 eV.',
          ],
          answer: 'E₁ ≈ 1.50 eV',
        },
        revisionPoints: [
          'For state n in a 1D box [0, L], the wave function ψₙ(x) = √(2/L) sin(nπx/L) has (n − 1) internal nodes.',
          'Heisenberg uncertainty principle requires Δx · Δpₓ ≥ ℏ / 2.',
        ],
      },
    ],
  },
  {
    slug: 'digital-electronics',
    name: 'Digital Electronics',
    code: 'EC204',
    shortDescription:
      'Boolean algebra, Karnaugh map minimization, combinational logic, and flip-flops.',
    iconKey: 'digital-electronics',
    pdfUrl: '/study-notes-pdf/digital-electronics-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'de-boolean-kmap',
        title: 'Boolean Algebra, De Morgan’s Laws & K-Map Minimization',
        moduleTag: 'Module 1 · Combinational Logic',
        conceptExplanation:
          'Boolean minimization reduces gate count and propagation delay in digital circuits. Karnaugh maps (K-Maps) arrange truth-table minterms in Gray code order so adjacent cells differ by a single variable.',
        definitions: [
          {
            term: 'Prime Implicant',
            definition:
              'Largest power-of-two grouping (1, 2, 4, 8, 16) of adjacent 1s in a K-Map that cannot be combined further.',
          },
          {
            term: 'Universal Gates (NAND / NOR)',
            definition:
              'Logic gates capable of implementing any Boolean function without needing any other gate type.',
          },
        ],
        formulas: [
          {
            label: 'De Morgan’s Theorems',
            expression: '(A · B)′ = A′ + B′ ,   (A + B)′ = A′ · B′',
            context: 'Used to convert SOP expressions to all-NAND implementations.',
          },
          {
            label: 'Consensus Theorem',
            expression: 'A B + A′ C + B C = A B + A′ C',
            context: 'Eliminates redundant hazard-covering term BC.',
          },
        ],
        workedExample: {
          problem:
            'Simplify the 3-variable Boolean function F(A, B, C) = ∑m(1, 3, 5, 7) using Boolean/K-Map reduction.',
          steps: [
            'Write binary minterms: m₁ = 001, m₃ = 011, m₅ = 101, m₇ = 111.',
            'Notice all four minterms have C = 1 while A and B take all 4 combinations (00, 01, 10, 11).',
            'Form a quad of all four 1s on the K-Map: A and B cancel out, leaving F = C.',
          ],
          answer: 'F(A, B, C) = C',
        },
        revisionPoints: [
          'Gray code ordering (00, 01, 11, 10) is mandatory on K-Map axes so physical adjacency matches logical adjacency.',
          'Don’t-care conditions (d) may be treated as 1s only when they enlarge a prime implicant group.',
        ],
      },
      {
        id: 'de-sequential-flipflops',
        title: 'Sequential Circuits: Flip-Flops, Counters & Setup/Hold Timing',
        moduleTag: 'Module 2 · Sequential Logic',
        conceptExplanation:
          'Sequential circuits combine logic gates with edge-triggered storage elements (flip-flops) whose outputs depend on both current inputs and previous state. Synchronous timing requires signals to remain stable around the active clock edge.',
        definitions: [
          {
            term: 'Setup Time (t_su) & Hold Time (t_h)',
            definition:
              'Minimum time data must remain stable before (t_su) and after (t_h) the triggering clock edge.',
          },
          {
            term: 'Race-Around Condition',
            definition:
              'Uncontrolled toggling in a level-triggered JK latch when J = K = 1, solved by master-slave or edge triggering.',
          },
        ],
        formulas: [
          {
            label: 'Flip-Flop Characteristic Equations',
            expression: 'D: Q(t+1) = D ,   JK: Q(t+1) = J Q′ + K′ Q ,   T: Q(t+1) = T ⊕ Q',
            context: 'Next-state equations for synchronous state machine analysis.',
          },
          {
            label: 'Maximum Clock Frequency',
            expression: 'T_clk ≥ t_cq + t_logic,max + t_su   ⇒   f_max = 1 / T_clk,min',
            context: 'Determines the maximum safe operating frequency of a synchronous path.',
          },
        ],
        workedExample: {
          problem:
            'A synchronous pipeline stage has flip-flop clock-to-Q delay t_cq = 2 ns, combinational logic delay t_logic = 5 ns, and setup time t_su = 1 ns. Find the maximum clock frequency f_max.',
          steps: [
            'Compute minimum clock period: T_clk,min = t_cq + t_logic + t_su = 2 + 5 + 1 = 8 ns.',
            'Convert period to frequency: f_max = 1 / (8 × 10⁻⁹ s) = 125 MHz.',
          ],
          answer: 'f_max = 125 MHz',
        },
        revisionPoints: [
          'An N-bit ripple counter divides the input clock frequency by 2ᴺ and has cumulative propagation delay N · t_pd.',
          'Hold time violations (t_cq + t_logic,min < t_h) cannot be fixed by slowing down the clock frequency.',
        ],
      },
    ],
  },
  {
    slug: 'signals-and-systems',
    name: 'Signals and Systems',
    code: 'EC301',
    shortDescription:
      'LTI system convolution, Fourier analysis, Laplace transforms, and sampling.',
    iconKey: 'signals-and-systems',
    pdfUrl: '/study-notes-pdf/signals-and-systems-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'sig-lti-convolution',
        title: 'LTI System Properties, Impulse Response & Convolution',
        moduleTag: 'Module 1 · Time-Domain Analysis',
        conceptExplanation:
          'A Linear Time-Invariant (LTI) system is completely characterized by its unit impulse response h(t) or h[n]. Any output y(t) is computed by convolving the input signal x(t) with h(t).',
        definitions: [
          {
            term: 'Causality in LTI Systems',
            definition:
              'An LTI system is causal if and only if its impulse response h(t) = 0 for all t < 0.',
          },
          {
            term: 'BIBO Stability',
            definition:
              'Bounded-Input Bounded-Output stability requires the impulse response to be absolutely integrable: ∫ |h(t)| dt < ∞.',
          },
        ],
        formulas: [
          {
            label: 'Continuous-Time Convolution Integral',
            expression: 'y(t) = x(t) * h(t) = ∫_{−∞}^{∞} x(τ) h(t − τ) dτ',
            context: 'Commutative, associative, and distributive over addition.',
          },
          {
            label: 'Discrete-Time Convolution Sum',
            expression: 'y[n] = x[n] * h[n] = ∑_{k=−∞}^{∞} x[k] h[n − k]',
            context: 'If x[n] has length N₁ and h[n] has length N₂, y[n] has length N₁ + N₂ − 1.',
          },
        ],
        workedExample: {
          problem:
            'Find the discrete-time convolution y[n] = x[n] * h[n] for x[n] = {1, 2, 1} (starting at n = 0) and h[n] = {1, −1} (starting at n = 0).',
          steps: [
            'Length of output sequence: L = 3 + 2 − 1 = 4 samples (n = 0, 1, 2, 3).',
            'y[0] = x[0]h[0] = (1)(1) = 1.',
            'y[1] = x[0]h[1] + x[1]h[0] = (1)(−1) + (2)(1) = 1.',
            'y[2] = x[1]h[1] + x[2]h[0] = (2)(−1) + (1)(1) = −1.',
            'y[3] = x[2]h[1] = (1)(−1) = −1.',
          ],
          answer: 'y[n] = {1, 1, −1, −1} for n = 0, 1, 2, 3',
        },
        revisionPoints: [
          'Convolving any signal x(t) with a shifted impulse δ(t − t₀) shifts the signal: x(t) * δ(t − t₀) = x(t − t₀).',
          'Cascade connection of LTI systems corresponds to convolution of their impulse responses: h_eq(t) = h₁(t) * h₂(t).',
        ],
      },
      {
        id: 'sig-fourier-sampling',
        title: 'Fourier Transform, Laplace ROC & Nyquist Sampling Theorem',
        moduleTag: 'Module 2 · Frequency-Domain & Sampling',
        conceptExplanation:
          'Frequency-domain transforms convert differential and convolution equations into algebraic products Y(s) = X(s)H(s). The Nyquist-Shannon theorem establishes the minimum sampling rate required to reconstruct band-limited signals without aliasing.',
        definitions: [
          {
            term: 'Region of Convergence (ROC)',
            definition:
              'Set of complex values s = σ + jω for which the Laplace transform integral converges.',
          },
          {
            term: 'Nyquist Rate (f_N)',
            definition:
              'Twice the highest frequency component f_max present in a band-limited signal: f_N = 2 f_max.',
          },
        ],
        formulas: [
          {
            label: 'Convolution Property of Fourier Transform',
            expression: 'x(t) * h(t)   ↔   X(jω) · H(jω)',
            context: 'Convolution in time becomes multiplication in frequency.',
          },
          {
            label: 'Nyquist-Shannon Sampling Criterion',
            expression: 'f_s ≥ 2 f_max',
            context: 'Prevents spectral overlap (aliasing) in sampled signals.',
          },
        ],
        workedExample: {
          problem:
            'A continuous-time audio test signal x(t) = 3 cos(400πt) + 2 sin(1200πt) is sampled uniformly. Determine the Nyquist frequency and minimum sampling rate f_s.',
          steps: [
            'Identify component frequencies from ω = 2πf: f₁ = 400π / (2π) = 200 Hz, and f₂ = 1200π / (2π) = 600 Hz.',
            'Maximum frequency component in x(t) is f_max = 600 Hz.',
            'Minimum sampling rate (Nyquist rate): f_s,min = 2 × f_max = 2 × 600 = 1200 Hz (samples/sec).',
          ],
          answer: 'f_max = 600 Hz, Minimum sampling rate f_s = 1200 Hz',
        },
        revisionPoints: [
          'A causal LTI system with rational transfer function H(s) is BIBO stable if and only if all poles lie in the open left-half s-plane (Re(s) < 0).',
          'Parseval’s theorem states total signal energy is conserved between time and frequency domains.',
        ],
      },
    ],
  },
  {
    slug: 'control-systems',
    name: 'Control Systems',
    code: 'EE302',
    shortDescription:
      'Transfer functions, feedback loops, transient response, and stability analysis.',
    iconKey: 'control-systems',
    pdfUrl: '/study-notes-pdf/control-systems-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'ctrl-transfer-feedback',
        title: 'Closed-Loop Transfer Functions & Block Diagram Reduction',
        moduleTag: 'Module 1 · System Modeling & Feedback',
        conceptExplanation:
          'Feedback control compares plant output C(s) against a reference input R(s) to reduce sensitivity to parameter variations, reject disturbances, and shape transient response. Negative feedback scales open-loop gain by 1 / (1 + G(s)H(s)).',
        definitions: [
          {
            term: 'Transfer Function G(s)',
            definition:
              'Ratio of Laplace transform of output to Laplace transform of input under zero initial conditions.',
          },
          {
            term: 'Characteristic Equation',
            definition:
              'Denominator equation 1 + G(s)H(s) = 0 whose roots (closed-loop poles) govern system stability.',
          },
        ],
        formulas: [
          {
            label: 'Canonical Negative Feedback Transfer Function',
            expression: 'T(s) = C(s) / R(s) = G(s) / [ 1 + G(s) H(s) ]',
            context: 'For unity feedback H(s) = 1, T(s) = G(s) / (1 + G(s)).',
          },
          {
            label: 'Mason’s Gain Formula',
            expression: 'T = (1 / Δ) ∑ₖ Pₖ Δₖ',
            context: 'Computes end-to-end gain directly from a signal flow graph.',
          },
        ],
        workedExample: {
          problem:
            'A unity negative feedback system has open-loop transfer function G(s) = 10 / (s(s + 7)). Find the closed-loop transfer function T(s) and closed-loop poles.',
          steps: [
            'Apply unity feedback formula: T(s) = G(s) / (1 + G(s)) = [10 / (s² + 7s)] / [1 + 10 / (s² + 7s)].',
            'Multiply numerator and denominator by (s² + 7s): T(s) = 10 / (s² + 7s + 10).',
            'Factor characteristic polynomial s² + 7s + 10 = (s + 2)(s + 5) = 0 ⇒ poles at s = −2 and s = −5.',
          ],
          answer: 'T(s) = 10 / (s² + 7s + 10), poles at s = −2, −5 (Stable)',
        },
        revisionPoints: [
          'Adding a pole to the open-loop transfer function pulls the root locus to the right, reducing relative stability.',
          'Adding a zero pulls the root locus to the left, improving damping and transient response speed.',
        ],
      },
      {
        id: 'ctrl-second-order-routh',
        title: 'Second-Order Transient Specs & Routh-Hurwitz Stability Criterion',
        moduleTag: 'Module 2 · Time Response & Stability',
        conceptExplanation:
          'Underdamped second-order systems are parameterized by natural frequency ωₙ and damping ratio ζ. The Routh-Hurwitz criterion determines whether any polynomial roots lie in the right-half s-plane without solving for the roots explicitly.',
        definitions: [
          {
            term: 'Damping Ratio (ζ)',
            definition:
              'Dimensionless parameter determining whether step response is undamped (ζ = 0), underdamped (0 < ζ < 1), critically damped (ζ = 1), or overdamped (ζ > 1).',
          },
          {
            term: 'Phase Margin (PM) & Gain Margin (GM)',
            definition:
              'Frequency-domain safety margins measuring proximity to the −1 + j0 instability point on a Bode/Nyquist plot.',
          },
        ],
        formulas: [
          {
            label: 'Standard Second-Order Transfer Function',
            expression: 'T(s) = ωₙ² / (s² + 2 ζ ωₙ s + ωₙ²)',
            context: 'Poles located at s = −ζωₙ ± jωₙ√(1 − ζ²).',
          },
          {
            label: 'Peak Overshoot & Settling Time (2% Criterion)',
            expression: '%M_p = 100 · exp(−π ζ / √(1 − ζ²)) ,   t_s ≈ 4 / (ζ ωₙ)',
            context: 'Key transient design specifications for underdamped systems.',
          },
        ],
        workedExample: {
          problem:
            'A closed-loop servo has T(s) = 36 / (s² + 7.2s + 36). Find the natural frequency ωₙ, damping ratio ζ, and 2% settling time t_s.',
          steps: [
            'Match with ωₙ² / (s² + 2ζωₙs + ωₙ²): ωₙ² = 36 ⇒ ωₙ = 6 rad/s.',
            'Use middle coefficient: 2 ζ ωₙ = 7.2 ⇒ 12 ζ = 7.2 ⇒ ζ = 0.6.',
            'Compute 2% settling time: t_s = 4 / (ζ ωₙ) = 4 / (0.6 × 6) = 4 / 3.6 ≈ 1.11 s.',
          ],
          answer: 'ωₙ = 6 rad/s, ζ = 0.6, t_s = 1.11 s',
        },
        revisionPoints: [
          'In a Routh array, the number of sign changes in the first column equals the number of roots in the right-half s-plane.',
          'A Type-1 unity feedback system has zero steady-state error for a step input and finite error 1/K_v for a ramp input.',
        ],
      },
    ],
  },
  {
    slug: 'electronic-devices-and-circuits',
    name: 'Electronic Devices and Circuits',
    code: 'EC201',
    shortDescription:
      'PN junction diodes, BJT and MOSFET amplifier biasing, and operational amplifiers.',
    iconKey: 'electronic-devices-and-circuits',
    pdfUrl: '/study-notes-pdf/electronic-devices-and-circuits-revision.pdf',
    isSampleResource: true,
    topics: [
      {
        id: 'edc-pn-diodes',
        title: 'PN Junction Diode Physics, Shockley Equation & Rectifiers',
        moduleTag: 'Module 1 · Semiconductor Diodes',
        conceptExplanation:
          'A PN junction forms a depletion region with a built-in potential barrier V_bi (~0.7 V for silicon). Forward bias narrows the depletion layer and enables exponential majority-carrier diffusion current.',
        definitions: [
          {
            term: 'Thermal Voltage (V_T)',
            definition:
              'Voltage equivalent of temperature kT/q, equal to approximately 25.9 mV at room temperature (300 K).',
          },
          {
            term: 'Peak Inverse Voltage (PIV)',
            definition:
              'Maximum reverse-bias voltage a rectifier diode must withstand without avalanche or Zener breakdown.',
          },
        ],
        formulas: [
          {
            label: 'Shockley Ideal Diode Equation',
            expression: 'I_D = I_S · [ exp(V_D / (η V_T)) − 1 ]',
            context: 'I_S is reverse saturation current; η is ideality factor (1 to 2).',
          },
          {
            label: 'Small-Signal Dynamic Resistance',
            expression: 'r_d = (dI_D / dV_D)⁻¹ ≈ V_T / I_DQ',
            context: 'AC resistance of a forward-biased diode around operating current I_DQ.',
          },
        ],
        workedExample: {
          problem:
            'A silicon diode is biased at DC operating current I_DQ = 2 mA at T = 300 K (V_T = 26 mV, η = 1). Calculate its small-signal dynamic resistance r_d.',
          steps: [
            'Apply dynamic resistance formula: r_d = V_T / I_DQ.',
            'Substitute V_T = 26 mV and I_DQ = 2 mA: r_d = 26 mV / 2 mA = 13 Ω.',
          ],
          answer: 'r_d = 13 Ω',
        },
        revisionPoints: [
          'A full-wave bridge rectifier achieves 81.2% maximum efficiency and ripple factor 0.482, with PIV = V_m (half that of a center-tapped transformer rectifier).',
          'Zener diodes operate in reverse breakdown to provide stable voltage regulation across varying load currents.',
        ],
      },
      {
        id: 'edc-transistors-opamps',
        title: 'BJT/MOSFET Small-Signal Models & Operational Amplifiers',
        moduleTag: 'Module 2 · Amplifiers & Op-Amps',
        conceptExplanation:
          'Transistor amplifiers convert a stable DC bias point (Q-point) into linear small-signal AC amplification governed by transconductance g_m. Operational amplifiers use high open-loop gain with negative feedback to realize precise gain blocks and active filters.',
        definitions: [
          {
            term: 'Transconductance (g_m)',
            definition:
              'Small-signal transfer ratio ΔI_out / ΔV_in relating input control voltage to output collector/drain current.',
          },
          {
            term: 'Common-Mode Rejection Ratio (CMRR)',
            definition:
              'Ratio of differential voltage gain A_d to common-mode gain A_cm, usually expressed in dB: 20 log₁₀(|A_d / A_cm|).',
          },
        ],
        formulas: [
          {
            label: 'BJT & MOSFET Transconductance',
            expression: 'BJT: g_m = I_C / V_T ,   MOSFET: g_m = 2 I_D / (V_GS − V_th)',
            context: 'Core small-signal parameter for voltage gain A_v = −g_m R_L.',
          },
          {
            label: 'Ideal Op-Amp Closed-Loop Gains',
            expression: 'Inverting: A_v = −R_f / R_in ,   Non-Inverting: A_v = 1 + (R_f / R₁)',
            context: 'Derived from virtual short (V₊ = V₋) and zero input current.',
          },
        ],
        workedExample: {
          problem:
            'Design a non-inverting operational amplifier circuit with input resistor R₁ = 2 kΩ to achieve a closed-loop voltage gain A_v = +11 V/V.',
          steps: [
            'Use the non-inverting gain equation: A_v = 1 + (R_f / R₁) = 11.',
            'Solve for ratio: R_f / R₁ = 10.',
            'Substitute R₁ = 2 kΩ: R_f = 10 × 2 kΩ = 20 kΩ.',
          ],
          answer: 'R_f = 20 kΩ',
        },
        revisionPoints: [
          'Common-Emitter (CE) / Common-Source (CS) stages provide high inverting voltage gain; Common-Collector (Emitter Follower) provides unity voltage gain with low output impedance.',
          'Maximum undistorted sinusoidal output frequency of an op-amp is limited by Slew Rate: SR = 2π f_max V_peak.',
        ],
      },
    ],
  },
];

export function findStudySubjectBySlug(
  slug: string | undefined
): StudySubjectCategory | undefined {
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();
  return STUDY_NOTES_CATALOG.find((s) => s.slug === clean);
}

export function getTotalStudyNotesCount(): number {
  return STUDY_NOTES_CATALOG.reduce((sum, subject) => sum + subject.topics.length, 0);
}
