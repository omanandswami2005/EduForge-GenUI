/**
 * Curated GenUI content used whenever live generation fails (every model
 * errored, timed out, network down, invalid output). Students never see an
 * error — they get hand-written, scaffold-appropriate content instead.
 *
 * Topic packs cover the Newton's Laws demo lesson with one of every component
 * type, so any scaffold level can be served. Unknown topics get a generic
 * study scaffold built from the concept name, so content is never off-topic.
 *
 * Everything here must satisfy genUISchema (enforced by genui-fallback.test.ts).
 */
import type { GenUIComponent, GenUIOutput } from "./genui-schema";

type ComponentName = GenUIComponent["component"];
type Pack = Record<ComponentName, GenUIComponent>;

// ── Newton's First Law / inertia ────────────────────────────────────────

const FIRST_LAW: Pack = {
    StepByStep: {
        component: "StepByStep",
        props: {
            concept: "Inertia and Newton's First Law",
            steps: [
                { number: 1, title: "Notice what objects 'want' to do", explanation: "Every object keeps doing what it is already doing. A resting object stays at rest; a moving object keeps moving at the same speed in the same direction.", example: "A book on a table stays put until you push it." },
                { number: 2, title: "Name that tendency: inertia", explanation: "**Inertia** is an object's resistance to changes in its motion. It is not a force — it is a property of matter.", example: "Passengers lurch forward when a bus brakes suddenly." },
                { number: 3, title: "Link inertia to mass", explanation: "The more mass an object has, the more inertia it has, so the harder it is to start, stop, or turn.", example: "Pushing an empty shopping cart vs. a full one." },
                { number: 4, title: "State the First Law", explanation: "An object stays at rest or in uniform motion **unless a net (unbalanced) force acts on it**.", example: "A hockey puck glides far on ice because friction is tiny." },
                { number: 5, title: "Check for balanced forces", explanation: "If all forces cancel ($F_{net} = 0$), velocity does not change — even if the object is moving.", example: "A car cruising at a steady 60 km/h has balanced forces." },
            ],
            summary: "No net force means no change in motion. Inertia — which grows with mass — is why objects resist changing what they're doing.",
        },
    },
    HintCard: {
        component: "HintCard",
        props: {
            hint_level: "gentle",
            hint_text: "Ask yourself: are the forces on the object **balanced** or **unbalanced**? Only an unbalanced (net) force can change its speed or direction.",
            follow_up_question: "If a spaceship far from any planet switches off its engines, what happens to its motion?",
        },
    },
    FormulaCard: {
        component: "FormulaCard",
        props: {
            formula: "$$\\sum \\vec{F} = 0 \\;\\Rightarrow\\; \\vec{v} = \\text{constant}$$",
            variables: [
                { symbol: "$\\sum \\vec{F}$", name: "net force", unit: "N" },
                { symbol: "$\\vec{v}$", name: "velocity", unit: "m/s" },
            ],
            example: {
                values: [
                    { key: "Engine thrust", value: "500 N forward" },
                    { key: "Air + road drag", value: "500 N backward" },
                ],
                result: "Net force = 0 N, so the car keeps a constant velocity",
            },
        },
    },
    AnalogyCard: {
        component: "AnalogyCard",
        props: {
            abstract_concept: "Inertia",
            real_world_analogy: "A heavy suitcase on an airport trolley that doesn't want to start rolling — and doesn't want to stop once it's moving.",
            how_they_match: [
                { concept_aspect: "Objects resist starting to move", analogy_aspect: "You have to shove hard to get the loaded trolley going" },
                { concept_aspect: "Objects resist stopping", analogy_aspect: "Once rolling, the trolley keeps going and is hard to halt" },
                { concept_aspect: "More mass means more inertia", analogy_aspect: "A trolley with three suitcases is harder to start and stop than one with a single bag" },
            ],
            limitation: "Real trolleys slow down because of friction; in the First Law, motion only changes when a net force like friction acts.",
        },
    },
    ConceptDiagram: {
        component: "ConceptDiagram",
        props: {
            title: "Does the motion change?",
            diagram_type: "process_flow",
            elements: [
                { id: "forces", label: "Add up all forces", description: "Draw every push and pull on the object", connects_to: ["balanced", "unbalanced"] },
                { id: "balanced", label: "Net force = 0", description: "Forces cancel out", connects_to: ["constant"] },
                { id: "unbalanced", label: "Net force ≠ 0", description: "One direction wins", connects_to: ["accelerates"] },
                { id: "constant", label: "Constant velocity", description: "Stays at rest or keeps moving steadily", connects_to: [] },
                { id: "accelerates", label: "Velocity changes", description: "Speeds up, slows down, or turns", connects_to: [] },
            ],
            annotations: ["Inertia is why the 'balanced' branch keeps its motion", "Moving ≠ net force — only *changing* motion needs one"],
        },
    },
    PracticeExercise: {
        component: "PracticeExercise",
        props: {
            problem: "A 1,200 kg car moves at a constant 20 m/s on a straight highway. The engine's forward force is 3,000 N. What is the total resistive force (air + friction) on the car?",
            hints: ["The speed is constant — what does that tell you about the net force?", "If the net force is zero, forward and backward forces must be equal."],
            worked_solution: "Constant velocity means acceleration is zero, so by the First Law the net force is zero. The resistive forces must exactly balance the 3,000 N forward force: **3,000 N backward**. The mass and speed are distractors.",
            key_insight: "Constant velocity (even a fast one) always means balanced forces.",
        },
    },
    ProofWalkthrough: {
        component: "ProofWalkthrough",
        props: {
            theorem: "If the net force on an object is zero, its velocity is constant.",
            proof_steps: [
                { step: 1, statement: "Start from Newton's Second Law: $\\sum \\vec{F} = m\\vec{a}$", justification: "Holds for any object of constant mass" },
                { step: 2, statement: "Set $\\sum \\vec{F} = 0$, so $m\\vec{a} = 0$", justification: "Hypothesis of the theorem" },
                { step: 3, statement: "Since $m > 0$, $\\vec{a} = 0$", justification: "Divide both sides by the non-zero mass" },
                { step: 4, statement: "$\\vec{a} = \\frac{d\\vec{v}}{dt} = 0 \\Rightarrow \\vec{v}$ is constant", justification: "A quantity with zero rate of change does not change" },
            ],
            conclusion: "Zero net force implies constant velocity — the First Law is the $\\vec{a} = 0$ special case of the Second Law (in an inertial frame).",
        },
    },
    ExpertSummary: {
        component: "ExpertSummary",
        props: {
            key_ideas: [
                "The First Law defines inertial reference frames: frames in which force-free objects move with constant velocity.",
                "Inertial mass quantifies resistance to acceleration and is experimentally equal to gravitational mass.",
                "Equilibrium can be static ($v = 0$) or dynamic ($v$ constant ≠ 0).",
            ],
            common_pitfalls: [
                "Believing motion requires a continuous force (the Aristotelian misconception).",
                "Calling inertia a force ('the force of inertia').",
                "Applying the law in accelerating frames, where fictitious forces appear.",
            ],
            advanced_connections: [
                "Galilean relativity: the laws of mechanics are identical in all inertial frames.",
                "Conservation of linear momentum for an isolated system generalizes the First Law.",
            ],
            challenge_question: "A pendulum hangs inside an accelerating train and tilts backward. Explain the tilt from the ground frame and from the train frame — which frame is inertial?",
        },
    },
};

// ── Newton's Second Law / F = ma ────────────────────────────────────────

const SECOND_LAW: Pack = {
    StepByStep: {
        component: "StepByStep",
        props: {
            concept: "Force, Mass, and Acceleration: $F = ma$",
            steps: [
                { number: 1, title: "Find the net force", explanation: "Add all forces as vectors. Only the **unbalanced** part changes motion.", example: "10 N right and 4 N left give a net force of 6 N right." },
                { number: 2, title: "Know the mass", explanation: "Mass (kg) measures how much the object resists acceleration.", example: "A 2 kg ball is harder to accelerate than a 0.5 kg ball." },
                { number: 3, title: "Apply $F = ma$", explanation: "Acceleration equals net force divided by mass: $a = F_{net} / m$.", example: "$a = 6\\text{ N} / 2\\text{ kg} = 3\\text{ m/s}^2$" },
                { number: 4, title: "Check the direction", explanation: "Acceleration always points the same way as the net force.", example: "Net force to the right → acceleration to the right." },
            ],
            summary: "Bigger net force → bigger acceleration; bigger mass → smaller acceleration. $F = ma$ ties them together.",
        },
    },
    HintCard: {
        component: "HintCard",
        props: {
            hint_level: "moderate",
            hint_text: "Before using $F = ma$, make sure $F$ is the **net** force. Subtract opposing forces like friction first, then divide by the mass.",
            follow_up_question: "If you double the net force but also double the mass, what happens to the acceleration?",
        },
    },
    FormulaCard: {
        component: "FormulaCard",
        props: {
            formula: "$$F_{net} = m \\cdot a$$",
            variables: [
                { symbol: "$F_{net}$", name: "net force", unit: "N" },
                { symbol: "$m$", name: "mass", unit: "kg" },
                { symbol: "$a$", name: "acceleration", unit: "m/s²" },
            ],
            example: {
                values: [
                    { key: "m", value: "4 kg" },
                    { key: "a", value: "2.5 m/s²" },
                ],
                result: "$F_{net} = 4 \\times 2.5 = 10\\text{ N}$",
            },
        },
    },
    AnalogyCard: {
        component: "AnalogyCard",
        props: {
            abstract_concept: "$F = ma$",
            real_world_analogy: "Kicking a football versus kicking a bowling ball with the same effort.",
            how_they_match: [
                { concept_aspect: "Same force applied", analogy_aspect: "You kick both equally hard" },
                { concept_aspect: "Larger mass → smaller acceleration", analogy_aspect: "The bowling ball barely moves; the football flies" },
                { concept_aspect: "Larger force → larger acceleration", analogy_aspect: "A harder kick sends the football faster" },
            ],
            limitation: "A kick is a brief impulse; $F = ma$ describes acceleration at each instant while the force acts.",
        },
    },
    ConceptDiagram: {
        component: "ConceptDiagram",
        props: {
            title: "How force and mass control acceleration",
            diagram_type: "relationship",
            elements: [
                { id: "force", label: "Net force ↑", description: "Directly proportional", connects_to: ["accel"] },
                { id: "mass", label: "Mass ↑", description: "Inversely proportional", connects_to: ["accel"] },
                { id: "accel", label: "Acceleration", description: "$a = F_{net}/m$", connects_to: ["velocity"] },
                { id: "velocity", label: "Velocity changes", description: "Speed and/or direction", connects_to: [] },
            ],
            annotations: ["Double the force → double the acceleration", "Double the mass → half the acceleration"],
        },
    },
    PracticeExercise: {
        component: "PracticeExercise",
        props: {
            problem: "A 50 kg crate is pushed across the floor with 200 N of force. Friction opposes it with 50 N. What is the crate's acceleration?",
            hints: ["Find the net force first: forward force minus friction.", "Then divide the net force by the mass."],
            worked_solution: "$F_{net} = 200 - 50 = 150\\text{ N}$. Then $a = F_{net}/m = 150 / 50 = 3\\text{ m/s}^2$ in the direction of the push.",
            key_insight: "Always use the net force — forgetting friction here would give 4 m/s², which is wrong.",
        },
    },
    ProofWalkthrough: {
        component: "ProofWalkthrough",
        props: {
            theorem: "For constant mass, $\\vec{F}_{net} = \\frac{d\\vec{p}}{dt}$ reduces to $\\vec{F}_{net} = m\\vec{a}$.",
            proof_steps: [
                { step: 1, statement: "Momentum is defined as $\\vec{p} = m\\vec{v}$", justification: "Definition of linear momentum" },
                { step: 2, statement: "Newton's Second Law in general form: $\\vec{F}_{net} = \\frac{d\\vec{p}}{dt}$", justification: "Newton's original statement" },
                { step: 3, statement: "$\\frac{d\\vec{p}}{dt} = m\\frac{d\\vec{v}}{dt} + \\vec{v}\\frac{dm}{dt}$", justification: "Product rule" },
                { step: 4, statement: "With $\\frac{dm}{dt} = 0$: $\\vec{F}_{net} = m\\vec{a}$", justification: "Constant mass; $\\vec{a} = \\frac{d\\vec{v}}{dt}$" },
            ],
            conclusion: "$F = ma$ is the constant-mass case of $F = dp/dt$; rockets and conveyor belts need the full momentum form.",
        },
    },
    ExpertSummary: {
        component: "ExpertSummary",
        props: {
            key_ideas: [
                "$\\vec{F}_{net} = d\\vec{p}/dt$ is the general law; $m\\vec{a}$ is its constant-mass form.",
                "It is a vector equation — apply it independently along each axis.",
                "Mass here is inertial mass: the proportionality constant between net force and acceleration.",
            ],
            common_pitfalls: [
                "Using a single applied force instead of the vector sum of all forces.",
                "Treating $ma$ as a force that appears on a free-body diagram.",
                "Using $F = ma$ for variable-mass systems such as rockets.",
            ],
            advanced_connections: [
                "Lagrangian mechanics recovers $F = ma$ from the Euler–Lagrange equations.",
                "In special relativity, $\\vec{F} = d\\vec{p}/dt$ survives but $\\vec{p} = \\gamma m \\vec{v}$.",
            ],
            challenge_question: "Two blocks (2 kg and 3 kg) touch on a frictionless surface. A 10 N force pushes the 2 kg block. What force does each block exert on the other — and does it change if you push the 3 kg block instead?",
        },
    },
};

// ── Newton's Third Law / action–reaction ────────────────────────────────

const THIRD_LAW: Pack = {
    StepByStep: {
        component: "StepByStep",
        props: {
            concept: "Action and Reaction: Newton's Third Law",
            steps: [
                { number: 1, title: "Forces come in pairs", explanation: "When object A pushes on object B, B pushes back on A.", example: "Your hand pushes a wall; the wall pushes your hand." },
                { number: 2, title: "Equal size, opposite direction", explanation: "The two forces in a pair always have the **same magnitude** and **opposite directions**.", example: "A swimmer pushes water back; water pushes the swimmer forward." },
                { number: 3, title: "They act on different objects", explanation: "The pair never cancels, because each force acts on a different body.", example: "A rocket pushes gas down; the gas pushes the rocket up." },
                { number: 4, title: "Different masses, different effects", explanation: "Equal forces can cause very different accelerations if the masses differ.", example: "Earth pulls an apple and the apple pulls Earth equally — only the apple visibly moves." },
            ],
            summary: "Every force has an equal and opposite partner acting on the other object.",
        },
    },
    HintCard: {
        component: "HintCard",
        props: {
            hint_level: "gentle",
            hint_text: "To find a reaction force, **swap the two objects** in the sentence: 'foot pushes ground' becomes 'ground pushes foot'.",
            follow_up_question: "If action and reaction are equal and opposite, why don't they cancel each other out?",
        },
    },
    FormulaCard: {
        component: "FormulaCard",
        props: {
            formula: "$$\\vec{F}_{A \\to B} = -\\vec{F}_{B \\to A}$$",
            variables: [
                { symbol: "$\\vec{F}_{A \\to B}$", name: "force A exerts on B", unit: "N" },
                { symbol: "$\\vec{F}_{B \\to A}$", name: "force B exerts on A", unit: "N" },
            ],
            example: {
                values: [
                    { key: "Skater A pushes skater B", value: "120 N east" },
                    { key: "Skater masses", value: "60 kg and 40 kg" },
                ],
                result: "B pushes A with 120 N west; A accelerates at 2 m/s², B at 3 m/s²",
            },
        },
    },
    AnalogyCard: {
        component: "AnalogyCard",
        props: {
            abstract_concept: "Action–reaction pairs",
            real_world_analogy: "Two people on ice skates pushing off each other's hands.",
            how_they_match: [
                { concept_aspect: "Forces come in pairs", analogy_aspect: "Both people feel a push, not just the one who 'started' it" },
                { concept_aspect: "Equal and opposite", analogy_aspect: "The pushes are equally strong in opposite directions" },
                { concept_aspect: "Mass decides the motion", analogy_aspect: "The lighter skater glides away faster" },
            ],
            limitation: "People feel effort and intention; physics forces don't — the wall 'pushes back' without doing anything.",
        },
    },
    ConceptDiagram: {
        component: "ConceptDiagram",
        props: {
            title: "Spotting a force pair",
            diagram_type: "comparison",
            elements: [
                { id: "action", label: "Foot pushes ground backward", description: "Acts on the ground", connects_to: ["reaction"] },
                { id: "reaction", label: "Ground pushes foot forward", description: "Acts on you — this moves you", connects_to: ["walk"] },
                { id: "walk", label: "You accelerate forward", description: "The ground force is external to you", connects_to: [] },
                { id: "earth", label: "Earth barely moves", description: "Its enormous mass means tiny acceleration", connects_to: [] },
            ],
            annotations: ["Pair forces: same type, same size, opposite directions, different objects", "Weight and the normal force are NOT a third-law pair"],
        },
    },
    PracticeExercise: {
        component: "PracticeExercise",
        props: {
            problem: "A 70 kg astronaut floating in space throws a 5 kg toolbox, pushing it with 35 N. What are the accelerations of the toolbox and the astronaut?",
            hints: ["The toolbox pushes back on the astronaut with the same 35 N.", "Use $a = F/m$ separately for each object."],
            worked_solution: "Toolbox: $a = 35 / 5 = 7\\text{ m/s}^2$ forward. Astronaut: $a = 35 / 70 = 0.5\\text{ m/s}^2$ backward. Same force, different masses, different accelerations.",
            key_insight: "Third-law forces are equal; the accelerations are not.",
        },
    },
    ProofWalkthrough: {
        component: "ProofWalkthrough",
        props: {
            theorem: "The Third Law implies conservation of momentum for two isolated interacting bodies.",
            proof_steps: [
                { step: 1, statement: "$\\vec{F}_{1 \\leftarrow 2} = -\\vec{F}_{2 \\leftarrow 1}$", justification: "Newton's Third Law" },
                { step: 2, statement: "$\\frac{d\\vec{p}_1}{dt} = \\vec{F}_{1 \\leftarrow 2}$ and $\\frac{d\\vec{p}_2}{dt} = \\vec{F}_{2 \\leftarrow 1}$", justification: "Second Law; the system is isolated" },
                { step: 3, statement: "$\\frac{d}{dt}(\\vec{p}_1 + \\vec{p}_2) = \\vec{F}_{1 \\leftarrow 2} + \\vec{F}_{2 \\leftarrow 1} = 0$", justification: "Add the equations; substitute step 1" },
            ],
            conclusion: "Total momentum $\\vec{p}_1 + \\vec{p}_2$ is constant — momentum conservation follows directly from the Third Law.",
        },
    },
    ExpertSummary: {
        component: "ExpertSummary",
        props: {
            key_ideas: [
                "Third-law pairs are the same interaction viewed from each body.",
                "The law underpins momentum conservation in isolated systems.",
                "Internal forces cancel in a system's net force, which is why only external forces move the centre of mass.",
            ],
            common_pitfalls: [
                "Pairing weight with the normal force (different interactions, same object).",
                "Thinking the larger object exerts the larger force in a collision.",
                "Cancelling pair forces in a single object's free-body diagram.",
            ],
            advanced_connections: [
                "Electromagnetic forces between moving charges can violate the strong form; momentum is restored by the field.",
                "Noether's theorem: momentum conservation ↔ translational symmetry of space.",
            ],
            challenge_question: "A horse pulls a cart. If the cart pulls back on the horse with an equal force, how does the pair ever start moving? Identify every external force that matters.",
        },
    },
};

// ── Applying all three laws / problem solving ──────────────────────────

const PROBLEM_SOLVING: Pack = {
    StepByStep: {
        component: "StepByStep",
        props: {
            concept: "Solving problems with Newton's three laws",
            steps: [
                { number: 1, title: "Isolate the object", explanation: "Pick one object and draw it alone — a **free-body diagram**.", example: "A box on a ramp, drawn as a dot." },
                { number: 2, title: "Draw every force", explanation: "Weight ($mg$) down, normal force perpendicular to the surface, friction along it, plus any applied forces.", example: "Weight, normal force, friction, push." },
                { number: 3, title: "Choose axes", explanation: "Align one axis with the expected acceleration to keep the maths simple.", example: "On a ramp, use axes parallel and perpendicular to the slope." },
                { number: 4, title: "Apply $\\sum F = ma$ per axis", explanation: "Write one equation for each axis and solve.", example: "$\\sum F_x = ma$ and $\\sum F_y = 0$" },
                { number: 5, title: "Sanity-check", explanation: "Check the units, the signs, and whether the answer is physically reasonable.", example: "A negative acceleration just means the opposite direction." },
            ],
            summary: "Free-body diagram → axes → $\\sum F = ma$ on each axis → check.",
        },
    },
    HintCard: {
        component: "HintCard",
        props: {
            hint_level: "direct",
            hint_text: "Draw the free-body diagram **before** writing any equation. Most mistakes come from a missing force (often friction or the normal force).",
            follow_up_question: "Which forces on your object are balanced, and which one causes the acceleration?",
        },
    },
    FormulaCard: {
        component: "FormulaCard",
        props: {
            formula: "$$\\sum F_x = m a_x, \\qquad \\sum F_y = m a_y$$",
            variables: [
                { symbol: "$\\sum F_x$", name: "net force along x", unit: "N" },
                { symbol: "$\\sum F_y$", name: "net force along y", unit: "N" },
                { symbol: "$m$", name: "mass", unit: "kg" },
                { symbol: "$a_x, a_y$", name: "acceleration components", unit: "m/s²" },
            ],
            example: {
                values: [
                    { key: "m", value: "10 kg" },
                    { key: "Applied force", value: "60 N along x" },
                    { key: "Friction", value: "20 N opposite" },
                ],
                result: "$a_x = (60 - 20)/10 = 4\\text{ m/s}^2$, $a_y = 0$",
            },
        },
    },
    AnalogyCard: {
        component: "AnalogyCard",
        props: {
            abstract_concept: "Free-body diagrams",
            real_world_analogy: "An accountant's ledger listing every deposit and withdrawal for one account.",
            how_they_match: [
                { concept_aspect: "List every force on one object", analogy_aspect: "List every transaction on one account" },
                { concept_aspect: "Net force decides the acceleration", analogy_aspect: "Net balance change decides whether the account grows" },
                { concept_aspect: "Missing a force gives a wrong answer", analogy_aspect: "A missing transaction gives a wrong balance" },
            ],
            limitation: "Forces are vectors with direction; money only has a sign.",
        },
    },
    ConceptDiagram: {
        component: "ConceptDiagram",
        props: {
            title: "Which law do I use?",
            diagram_type: "hierarchy",
            elements: [
                { id: "q", label: "What does the problem ask?", description: null, connects_to: ["l1", "l2", "l3"] },
                { id: "l1", label: "First Law", description: "Constant velocity or rest → forces balance", connects_to: [] },
                { id: "l2", label: "Second Law", description: "Changing velocity → $\\sum F = ma$", connects_to: [] },
                { id: "l3", label: "Third Law", description: "Two interacting objects → equal, opposite pair", connects_to: [] },
            ],
            annotations: ["Real problems usually need more than one law", "Always start from a free-body diagram"],
        },
    },
    PracticeExercise: {
        component: "PracticeExercise",
        props: {
            problem: "A 20 kg sled is pulled with 100 N of force at 30° above the horizontal across flat snow. Friction is 40 N. Find the sled's horizontal acceleration.",
            hints: ["Split the pull into components: $F_x = 100\\cos 30°$.", "Net horizontal force = $F_x$ − friction."],
            worked_solution: "$F_x = 100 \\cos 30° \\approx 86.6\\text{ N}$. $F_{net,x} = 86.6 - 40 = 46.6\\text{ N}$. $a_x = 46.6 / 20 \\approx 2.3\\text{ m/s}^2$.",
            key_insight: "Only the component of a force along the motion changes speed along that direction.",
        },
    },
    ProofWalkthrough: {
        component: "ProofWalkthrough",
        props: {
            theorem: "A block on a frictionless incline of angle $\\theta$ accelerates at $a = g\\sin\\theta$, independent of its mass.",
            proof_steps: [
                { step: 1, statement: "Forces: weight $mg$ and normal force $N$", justification: "Free-body diagram, frictionless surface" },
                { step: 2, statement: "Along the slope: $mg\\sin\\theta = ma$", justification: "Second Law; $N$ has no component along the slope" },
                { step: 3, statement: "Perpendicular: $N - mg\\cos\\theta = 0$", justification: "No acceleration off the surface" },
                { step: 4, statement: "$a = g\\sin\\theta$", justification: "Divide step 2 by $m$" },
            ],
            conclusion: "The mass cancels, so every object slides down a frictionless incline with the same acceleration.",
        },
    },
    ExpertSummary: {
        component: "ExpertSummary",
        props: {
            key_ideas: [
                "Free-body diagrams turn physics into a set of per-axis linear equations.",
                "Constraints (ropes, surfaces) link accelerations in multi-body systems.",
                "Choosing axes along the acceleration minimises trigonometry.",
            ],
            common_pitfalls: [
                "Assuming the normal force always equals $mg$ (false on inclines or with angled pulls).",
                "Forgetting that tension is the same throughout an ideal massless rope.",
                "Mixing the forces of two objects in one free-body diagram.",
            ],
            advanced_connections: [
                "Atwood machines and connected-body systems as coupled equations.",
                "Non-inertial frames and pseudo-forces (e.g. $-m\\vec{a}_{frame}$).",
            ],
            challenge_question: "In an Atwood machine with masses $m_1 > m_2$, derive the acceleration and the rope tension. What happens as $m_1 \\to \\infty$?",
        },
    },
};

// ── Generic pack for topics without curated content ─────────────────────

function genericPack(concept: string): Pack {
    return {
        StepByStep: {
            component: "StepByStep",
            props: {
                concept,
                steps: [
                    { number: 1, title: "Say it in one sentence", explanation: `Write a one-sentence definition of **${concept}** in your own words.`, example: null },
                    { number: 2, title: "Find the key terms", explanation: "Underline the two or three terms the definition depends on and make sure you can explain each.", example: null },
                    { number: 3, title: "Connect it to something familiar", explanation: "Think of an everyday situation where this idea shows up.", example: null },
                    { number: 4, title: "Test yourself", explanation: "Answer the practice questions below — each answer updates your mastery score.", example: null },
                ],
                summary: `Define, break down, connect, and test — the core loop for learning ${concept}.`,
            },
        },
        HintCard: {
            component: "HintCard",
            props: {
                hint_level: "gentle",
                hint_text: `Start with what **${concept}** is *not* — ruling out common confusions often makes the definition click.`,
                follow_up_question: `Where would you expect to see ${concept} outside the classroom?`,
            },
        },
        FormulaCard: {
            component: "FormulaCard",
            props: {
                formula: "Definition → Key terms → Example → Check",
                variables: [
                    { symbol: "D", name: "definition in your own words", unit: "sentence" },
                    { symbol: "E", name: "a concrete example", unit: "case" },
                ],
                example: { values: [{ key: "Concept", value: concept }], result: "Explain it to a friend using one definition and one example" },
            },
        },
        AnalogyCard: {
            component: "AnalogyCard",
            props: {
                abstract_concept: concept,
                real_world_analogy: "Learning a new route through a city: first the main road, then the landmarks, then the shortcuts.",
                how_they_match: [
                    { concept_aspect: "Core definition", analogy_aspect: "The main road you always come back to" },
                    { concept_aspect: "Supporting ideas", analogy_aspect: "Landmarks that tell you where you are" },
                    { concept_aspect: "Advanced applications", analogy_aspect: "Shortcuts you use once the map is familiar" },
                ],
                limitation: "Concepts link in many directions at once, not along a single route.",
            },
        },
        ConceptDiagram: {
            component: "ConceptDiagram",
            props: {
                title: concept,
                diagram_type: "hierarchy",
                elements: [
                    { id: "core", label: concept, description: "The central idea", connects_to: ["terms", "examples", "uses"] },
                    { id: "terms", label: "Key terms", description: "Vocabulary the idea depends on", connects_to: [] },
                    { id: "examples", label: "Examples", description: "Concrete cases", connects_to: [] },
                    { id: "uses", label: "Applications", description: "Where it's used", connects_to: [] },
                ],
                annotations: ["Fill in each branch from your notes", "Click a node to highlight its links"],
            },
        },
        PracticeExercise: {
            component: "PracticeExercise",
            props: {
                problem: `Explain ${concept} to a classmate who missed the lesson, using one definition and one real-world example.`,
                hints: ["Start with the one-sentence definition.", "Choose an example you have personally seen."],
                worked_solution: "A strong answer (1) defines the concept precisely, (2) names its key terms, and (3) shows it in a concrete example with the terms labelled.",
                key_insight: "If you can teach it simply, you understand it.",
            },
        },
        ProofWalkthrough: {
            component: "ProofWalkthrough",
            props: {
                theorem: `Reasoning chain for ${concept}`,
                proof_steps: [
                    { step: 1, statement: "State the definition precisely", justification: "Everything else builds on it" },
                    { step: 2, statement: "Identify the conditions under which it applies", justification: "Knowing the limits prevents misuse" },
                    { step: 3, statement: "Apply it to a specific case and check the result", justification: "Verification against a known example" },
                ],
                conclusion: "A precise definition, known limits, and a verified example make an argument complete.",
            },
        },
        ExpertSummary: {
            component: "ExpertSummary",
            props: {
                key_ideas: [`${concept} rests on a precise definition and a clear domain of validity.`, "Connecting it to neighbouring concepts deepens retention."],
                common_pitfalls: ["Memorising the wording without being able to apply it.", "Applying it outside the conditions where it holds."],
                advanced_connections: ["Look for where this concept appears in later topics of the course."],
                challenge_question: `Construct a case where a naïve application of ${concept} gives the wrong answer, and explain why.`,
            },
        },
    };
}

// ── Selection ───────────────────────────────────────────────────────────

const TOPICS: { keywords: string[]; pack: Pack }[] = [
    { keywords: ["third law", "action", "reaction", "force pair", "equal and opposite"], pack: THIRD_LAW },
    { keywords: ["problem solving", "free body", "all three", "vector force", "framework"], pack: PROBLEM_SOLVING },
    { keywords: ["second law", "f=ma", "f = ma", "acceleration", "mass"], pack: SECOND_LAW },
    { keywords: ["first law", "inertia", "balanced force", "net force", "at rest"], pack: FIRST_LAW },
    { keywords: ["newton"], pack: FIRST_LAW },
];

/** Level-appropriate component preference; filtered by the scaffold's allowed set. */
const PREFERENCE: Record<number, ComponentName[]> = {
    0: ["StepByStep", "AnalogyCard", "HintCard", "FormulaCard"],
    1: ["StepByStep", "ConceptDiagram", "HintCard", "FormulaCard"],
    2: ["ConceptDiagram", "FormulaCard", "PracticeExercise", "HintCard"],
    3: ["ConceptDiagram", "PracticeExercise", "ProofWalkthrough"],
    4: ["ExpertSummary", "ProofWalkthrough", "PracticeExercise", "ConceptDiagram"],
};

function pickPack(conceptName: string): Pack {
    const text = conceptName.toLowerCase();
    return TOPICS.find((t) => t.keywords.some((k) => text.includes(k)))?.pack ?? genericPack(conceptName);
}

/**
 * Curated components for a concept at a scaffold level (max 3), restricted to
 * the components that level allows — the same gating the AI is held to.
 */
export function buildFallbackGenUI({
    conceptName,
    scaffoldLevel,
    allowed,
}: {
    conceptName: string;
    scaffoldLevel: number;
    allowed?: string[];
}): GenUIOutput {
    const level = Math.min(4, Math.max(0, Math.round(scaffoldLevel)));
    const pack = pickPack(conceptName);
    const order = PREFERENCE[level];
    const permitted = allowed?.length ? order.filter((c) => allowed.includes(c)) : order;
    const chosen = (permitted.length ? permitted : order).slice(0, 3);
    return { components: chosen.map((name) => pack[name]) };
}
