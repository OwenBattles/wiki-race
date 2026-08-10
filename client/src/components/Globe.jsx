import { useEffect, useRef } from 'react';
import '../styles/Globe.css';

// A globe: one curved surface, divided by lines into pieces, each carrying a glyph.
//
// Earlier versions assembled it from flat tiles placed around a sphere with CSS 3D
// transforms. That approach has a ceiling — a CSS transform is affine, so a tile cannot
// bend. Tiles splayed at the horizon where they lie edge-on, the silhouette was a polygon
// pretending to be a circle, and every seam needed its two tiles negotiated into agreement.
//
// Treating it as a surface removes all three problems at once. The outline is a real circle.
// The dividing lines are sampled along the sphere, so they curve with it. And a seam is a
// single line: whichever way it bulges is a tab on one side and a blank on the other, for
// free, with nothing to reconcile.

// Scripts chosen for system font coverage. Anything more exotic (Cherokee, Runic, Ethiopic)
// renders as a tofu box on at least one common platform, which would read as broken rather
// than worldly.
const GLYPHS = [
    'W', 'A', 'E', 'R', 'Q', 'K', 'M', 'S', 'N', 'T',
    'Ω', 'Δ', 'Σ', 'Φ', 'Λ', 'Ψ', 'Γ', 'Θ',
    'Ж', 'Я', 'Д', 'Б', 'И', 'Ф',
    'א', 'ב', 'ש', 'ל', 'מ',
    'ع', 'ن', 'ه', 'م', 'ح',
    'अ', 'क', 'ह', 'भ', 'र',
    '中', '文', '知', '語', '書', '学', '道', '天',
    'あ', 'か', 'さ', 'ん', 'の', 'ま',
    '한', '글', '문', '민',
    'ก', 'ข', 'ค', 'ง',
];

const R = 104;              // sphere radius, in viewBox units
const PER_FACE = 4;         // cells per side of each cube face — 96 pieces in total
const AMBIENT_SPIN = 5.6;   // degrees per second, when left alone
const DRAG_PER_PIXEL = 0.4;
const REST_TILT = -14;
const MAX_TILT = 34;
const SPIN_SETTLE = 1.6;
const TILT_SETTLE = 2.6;

// A cube face, as the direction its grid coordinates sweep. Cube-sphere rather than
// latitude/longitude: a lat/long cell at 80° is six times narrower than one at the equator,
// which reads as a mistake however it is dressed.
const FACES = [
    (u, v) => [1, v, -u],
    (u, v) => [-1, v, u],
    (u, v) => [u, 1, v],
    (u, v) => [u, -1, -v],
    (u, v) => [u, v, 1],
    (u, v) => [-u, v, -1],
];

const norm = ([x, y, z]) => {
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
};
const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const key = ([x, y, z]) => `${x.toFixed(4)}|${y.toFixed(4)}|${z.toFixed(4)}`;

const hash = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

// Great-circle interpolation, so a dividing line follows the surface rather than cutting
// through it.
const slerp = (a, b, t) => {
    const angle = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
    if (angle < 1e-6) return a;
    const sin = Math.sin(angle);
    const wa = Math.sin((1 - t) * angle) / sin;
    const wb = Math.sin(t * angle) / sin;
    return norm([
        a[0] * wa + b[0] * wb,
        a[1] * wa + b[1] * wb,
        a[2] * wa + b[2] * wb,
    ]);
};

// One dividing line from a to b, with a jigsaw knob in the middle. The knob belongs to the
// line, not to either piece, so it is a tab on one side and the matching blank on the other.
//
// The head is traced as a circle rather than pushed out as a per-point offset. That is what
// gives a tab its neck: the outline has to curve back on itself, so the head is wider than
// the stem it sits on, and a single offset per position along the edge cannot describe an
// overhang like that — it can only make a bump.
const HEAD = 0.17;          // radius of the knob's head, as a fraction of the seam
const STEM = 0.125;         // how far the head's centre sits off the seam
const ARC_STEPS = 18;
const STRAIGHT_STEPS = 5;

const seamPoints = (a, b, direction) => {
    const span = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
    const head = HEAD * span;
    const stem = STEM * span;
    // Where the head's circle crosses the seam. Because the head is set off by less than its
    // radius, it crosses close in, leaving a narrow neck and an overhanging top.
    const neck = Math.sqrt(Math.max(0, head * head - stem * stem));

    // A point at (along, out) in the seam's own frame, laid back onto the sphere.
    const place = (along, out) => {
        const t = 0.5 + along / span;
        const base = slerp(a, b, Math.min(1, Math.max(0, t)));
        if (Math.abs(out) < 1e-9) return base;

        const ahead = slerp(a, b, Math.min(1, Math.max(0, t + 0.01)));
        const forward = norm([ahead[0] - base[0], ahead[1] - base[1], ahead[2] - base[2]]);
        const sideways = norm(cross(base, forward));
        const amount = out * direction;
        return norm([
            base[0] + sideways[0] * amount,
            base[1] + sideways[1] * amount,
            base[2] + sideways[2] * amount,
        ]);
    };

    const points = [];

    // Seam up to the neck.
    for (let i = 0; i <= STRAIGHT_STEPS; i += 1) {
        const along = -span / 2 + (i / STRAIGHT_STEPS) * (span / 2 - neck);
        points.push(place(along, 0));
    }

    // Around the head: the long way over the top, which is what makes it overhang.
    const from = Math.atan2(-stem, -neck);
    const to = Math.atan2(-stem, neck) - Math.PI * 2;
    for (let i = 0; i <= ARC_STEPS; i += 1) {
        const angle = from + ((to - from) * i) / ARC_STEPS;
        points.push(place(Math.cos(angle) * head, stem + Math.sin(angle) * head));
    }

    // Neck to the far end.
    for (let i = 0; i <= STRAIGHT_STEPS; i += 1) {
        const along = neck + (i / STRAIGHT_STEPS) * (span / 2 - neck);
        points.push(place(along, 0));
    }

    return points;
};

const buildGlobe = () => {
    const corner = (face, i, j) =>
        norm(FACES[face]((i / PER_FACE) * 2 - 1, (j / PER_FACE) * 2 - 1));
    const seams = new Map();
    const cells = [];
    let index = 0;

    for (let face = 0; face < FACES.length; face += 1) {
        for (let row = 0; row < PER_FACE; row += 1) {
            for (let col = 0; col < PER_FACE; col += 1) {
                cells.push({
                    centre: norm(FACES[face](
                        ((col + 0.5) / PER_FACE) * 2 - 1,
                        ((row + 0.5) / PER_FACE) * 2 - 1,
                    )),
                    glyph: GLYPHS[index % GLYPHS.length],
                    accent: index % 13 === 6,
                });
                index += 1;

                // Keying a seam by its two endpoints means a shared edge is stored once —
                // including across the rims where cube faces meet, whose cells land on the
                // same points of the cube edge. One line, drawn once, serves both pieces.
                const edges = [
                    [corner(face, col, row), corner(face, col + 1, row)],
                    [corner(face, col, row), corner(face, col, row + 1)],
                    [corner(face, col + 1, row), corner(face, col + 1, row + 1)],
                    [corner(face, col, row + 1), corner(face, col + 1, row + 1)],
                ];

                for (const [a, b] of edges) {
                    const id = [key(a), key(b)].sort().join('~');
                    if (!seams.has(id)) {
                        // Which way it bulges is arbitrary but fixed per seam.
                        seams.set(id, seamPoints(a, b, (hash(id) & 1) === 0 ? 1 : -1));
                    }
                }
            }
        }
    }

    return { seams: [...seams.values()], cells };
};

const { seams: SEAMS, cells: CELLS } = buildGlobe();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function Globe() {
    const svgRef = useRef(null);
    const seamPathRef = useRef(null);
    const glyphRefs = useRef([]);
    const frameRef = useRef(0);

    const motion = useRef({
        spin: 0,
        tilt: REST_TILT,
        spinRate: AMBIENT_SPIN,
        dragging: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
        lastMoveAt: 0,
    });

    useEffect(() => {
        const svg = svgRef.current;
        const seamPath = seamPathRef.current;
        if (!svg || !seamPath) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let last = performance.now();
        let running = false;

        const draw = () => {
            const { spin, tilt } = motion.current;
            const ay = (spin * Math.PI) / 180;
            const ax = (tilt * Math.PI) / 180;
            const cosY = Math.cos(ay);
            const sinY = Math.sin(ay);
            const cosX = Math.cos(ax);
            const sinX = Math.sin(ax);

            // Spin about the vertical, then tilt. z ends up pointing at the viewer, so a
            // positive z means the point is on the near side of the globe.
            const project = ([x, y, z]) => {
                const x1 = x * cosY + z * sinY;
                const z1 = -x * sinY + z * cosY;
                const y2 = y * cosX - z1 * sinX;
                const z2 = y * sinX + z1 * cosX;
                return [x1 * R, -y2 * R, z2];
            };

            // Every visible seam goes into one path string and one attribute write, rather
            // than several hundred elements each updated on their own.
            let d = '';
            for (const seam of SEAMS) {
                let open = false;
                for (const point of seam) {
                    const [px, py, pz] = project(point);
                    if (pz <= 0.02) {          // over the horizon — break the run
                        open = false;
                        continue;
                    }
                    d += `${open ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
                    open = true;
                }
            }
            seamPath.setAttribute('d', d);

            for (let i = 0; i < CELLS.length; i += 1) {
                const node = glyphRefs.current[i];
                if (!node) continue;

                const [px, py, pz] = project(CELLS[i].centre);
                if (pz <= 0.12) {
                    node.style.display = 'none';
                    continue;
                }

                node.style.display = '';
                node.setAttribute('x', px.toFixed(1));
                node.setAttribute('y', py.toFixed(1));
                // Foreshortening: glyphs shrink and fade as their piece turns away.
                node.setAttribute('font-size', (13 * (0.55 + 0.45 * pz)).toFixed(2));
                node.setAttribute('opacity', Math.min(1, pz * 1.9).toFixed(2));
            }
        };

        const step = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            const m = motion.current;

            if (!m.dragging) {
                const target = reduceMotion.matches ? 0 : AMBIENT_SPIN;
                m.spinRate += (target - m.spinRate) * (1 - Math.exp(-SPIN_SETTLE * dt));
                m.spin += m.spinRate * dt;
                m.tilt += (REST_TILT - m.tilt) * (1 - Math.exp(-TILT_SETTLE * dt));
            }

            draw();

            const settled =
                !m.dragging &&
                Math.abs(m.spinRate) < 0.05 &&
                Math.abs(m.tilt - REST_TILT) < 0.05;

            if (settled) {
                running = false;
                return;
            }
            frameRef.current = requestAnimationFrame(step);
        };

        const start = () => {
            if (running) return;
            running = true;
            last = performance.now();
            frameRef.current = requestAnimationFrame(step);
        };

        const stop = () => {
            running = false;
            cancelAnimationFrame(frameRef.current);
        };

        const onVisibility = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', onVisibility);

        const observer = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
            { threshold: 0 }
        );
        observer.observe(svg);

        const onPointerDown = (e) => {
            const m = motion.current;
            m.dragging = true;
            m.pointerId = e.pointerId;
            m.lastX = e.clientX;
            m.lastY = e.clientY;
            m.lastMoveAt = performance.now();
            m.spinRate = 0;
            svg.setPointerCapture?.(e.pointerId);
            start();
        };

        const onPointerMove = (e) => {
            const m = motion.current;
            if (!m.dragging || e.pointerId !== m.pointerId) return;

            const dx = e.clientX - m.lastX;
            const dy = e.clientY - m.lastY;
            const now = performance.now();
            const dt = Math.max((now - m.lastMoveAt) / 1000, 1 / 240);

            m.spin += dx * DRAG_PER_PIXEL;
            m.tilt = clamp(m.tilt - dy * DRAG_PER_PIXEL, -MAX_TILT, MAX_TILT);
            m.spinRate = (dx * DRAG_PER_PIXEL) / dt;

            m.lastX = e.clientX;
            m.lastY = e.clientY;
            m.lastMoveAt = now;
            draw();
        };

        const onPointerUp = (e) => {
            const m = motion.current;
            if (e.pointerId !== m.pointerId) return;
            // A pointer held still before release should not fling the globe.
            if (performance.now() - m.lastMoveAt > 120) m.spinRate = 0;
            m.dragging = false;
            m.pointerId = null;
            svg.releasePointerCapture?.(e.pointerId);
            start();
        };

        svg.addEventListener('pointerdown', onPointerDown);
        svg.addEventListener('pointermove', onPointerMove);
        svg.addEventListener('pointerup', onPointerUp);
        svg.addEventListener('pointercancel', onPointerUp);

        draw();
        if (!reduceMotion.matches) start();

        return () => {
            stop();
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            svg.removeEventListener('pointerdown', onPointerDown);
            svg.removeEventListener('pointermove', onPointerMove);
            svg.removeEventListener('pointerup', onPointerUp);
            svg.removeEventListener('pointercancel', onPointerUp);
        };
    }, []);

    const box = R + 6;

    return (
        // Decorative, and the interaction is decorative too: it conveys nothing and leads
        // nowhere, so it stays out of the accessibility tree rather than becoming a focus
        // stop that does nothing for anyone who lands on it.
        <div className="globe" aria-hidden="true">
            <svg
                ref={svgRef}
                className="globe-svg"
                viewBox={`${-box} ${-box} ${box * 2} ${box * 2}`}
            >
                <defs>
                    <radialGradient id="globe-body" cx="36%" cy="30%" r="78%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="62%" stopColor="#fbfaf7" />
                        <stop offset="100%" stopColor="#e9e3d7" />
                    </radialGradient>
                </defs>

                {/* The surface itself — one circle, so the outline is genuinely round. */}
                <circle r={R} fill="url(#globe-body)" stroke="#ddd8cd" strokeWidth="1" />

                {/* Every dividing line, in a single path. */}
                <path ref={seamPathRef} className="globe-seams" />

                {CELLS.map((cell, i) => (
                    <text
                        key={i}
                        ref={(node) => { glyphRefs.current[i] = node; }}
                        className={cell.accent ? 'globe-glyph is-accent' : 'globe-glyph'}
                        textAnchor="middle"
                        dominantBaseline="central"
                    >
                        {cell.glyph}
                    </text>
                ))}
            </svg>
        </div>
    );
}
