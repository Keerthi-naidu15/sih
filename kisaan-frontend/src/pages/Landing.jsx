import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const titleVariant = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 }
};

const subtitleVariant = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
};

const actionVariant = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 }
};

const buttonVariant = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
};

export default function Landing() {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const [travel, setTravel] = useState({ x: 220, y: -230 });

    useEffect(() => {
        const updateTravel = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setTravel({
                x: Math.min(width * 0.34, 300),
                y: -Math.min(height * 0.3, 240)
            });
        };

        updateTravel();
        window.addEventListener('resize', updateTravel);

        return () => window.removeEventListener('resize', updateTravel);
    }, []);

    const sequenceStart = prefersReducedMotion ? 0.1 : 4.6;
    const orbDuration = prefersReducedMotion ? 0.01 : 2.45;
    const shellDelay = prefersReducedMotion ? 0.02 : 3.05;
    const soilDelay = prefersReducedMotion ? 0.01 : 2.55;
    const sproutDelay = prefersReducedMotion ? 0.03 : 3.28;

    return (
        <div className="flex min-h-screen items-center justify-center py-10 text-white font-sans">
            <div className="w-full max-w-5xl px-4 md:px-6">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-black/20 px-6 py-10 shadow-2xl backdrop-blur-md md:px-10 md:py-14">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_36%)]" />

                    <div className="relative z-10 flex min-h-[72vh] flex-col items-center justify-center">
                        <div className="mb-6 flex items-center gap-2 text-green-400">
                            <Leaf size={22} className="text-green-500" />
                            <span className="text-lg font-bold tracking-tight">Kisaan Konnect</span>
                        </div>

                        <div className="relative flex h-[250px] w-full max-w-[420px] items-center justify-center md:h-[290px]">
                            <motion.div
                                aria-hidden="true"
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: travel.x + 24, y: travel.y - 8 }}
                                animate={prefersReducedMotion ? { opacity: 0 } : { opacity: [0, 0.34, 0.18, 0] }}
                                transition={{ duration: orbDuration, ease: [0.2, 0.9, 0.2, 1] }}
                                className="absolute h-9 w-9 rounded-full bg-green-400/30 blur-2xl"
                            />

                            <motion.div
                                aria-hidden="true"
                                initial={prefersReducedMotion ? { opacity: 0, scale: 0.8, x: 0, y: 10 } : { opacity: 1, scale: 0.9, x: travel.x, y: travel.y }}
                                animate={
                                    prefersReducedMotion
                                        ? { opacity: 0, scale: 0.82 }
                                        : {
                                            x: [travel.x, travel.x * 0.55, travel.x * 0.18, 0, 0],
                                            y: [travel.y, travel.y * 0.64, travel.y * 0.18, 0, 0],
                                            rotate: [0, 135, 280, 335, 335],
                                            scale: [0.9, 1, 1.04, 1.06, 0.82],
                                            opacity: [1, 1, 1, 1, 0]
                                        }
                                }
                                transition={{
                                    duration: prefersReducedMotion ? 0.01 : 3.45,
                                    times: prefersReducedMotion ? undefined : [0, 0.44, 0.78, 0.88, 1],
                                    ease: [0.22, 1, 0.36, 1]
                                }}
                                className="absolute"
                            >
                                <div className="relative h-8 w-10 rounded-[55%_45%_60%_40%/55%_55%_45%_45%] border border-green-300/35 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 shadow-[0_0_22px_rgba(34,197,94,0.45)]">
                                    <motion.div
                                        aria-hidden="true"
                                        animate={prefersReducedMotion ? { opacity: 0.4, scale: 1 } : { opacity: [0.35, 0.85, 0.45], scale: [1, 1.18, 1] }}
                                        transition={{ duration: 0.9, delay: prefersReducedMotion ? 0 : 2.45 }}
                                        className="absolute inset-0 rounded-[inherit] bg-green-300/35 blur-md"
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                aria-hidden="true"
                                initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
                                animate={
                                    prefersReducedMotion
                                        ? { opacity: 0 }
                                        : { opacity: [0, 1, 0], x: [-16, -30], y: [4, 20], rotate: [-10, -28] }
                                }
                                transition={{ duration: 0.85, delay: shellDelay, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute h-8 w-5 rounded-l-full border border-green-300/25 bg-gradient-to-br from-green-500 to-emerald-700 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                style={{ clipPath: 'inset(0 48% 0 0 round 999px)' }}
                            />

                            <motion.div
                                aria-hidden="true"
                                initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
                                animate={
                                    prefersReducedMotion
                                        ? { opacity: 0 }
                                        : { opacity: [0, 1, 0], x: [16, 30], y: [4, 18], rotate: [10, 28] }
                                }
                                transition={{ duration: 0.85, delay: shellDelay, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute h-8 w-5 rounded-r-full border border-green-300/25 bg-gradient-to-br from-green-500 to-emerald-700 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                style={{ clipPath: 'inset(0 0 0 48% round 999px)' }}
                            />

                            <motion.div
                                aria-hidden="true"
                                initial={{ opacity: prefersReducedMotion ? 1 : 0, scaleX: prefersReducedMotion ? 1 : 0.3, scaleY: prefersReducedMotion ? 1 : 0.7 }}
                                animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
                                transition={{ duration: 0.8, delay: soilDelay, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute bottom-[54px] h-8 w-32 rounded-[999px] border border-white/5 bg-gradient-to-r from-[#2a1d14] via-[#3a2618] to-[#2f1f16] shadow-[0_10px_35px_rgba(0,0,0,0.38)] md:bottom-[62px]"
                            >
                                <div className="absolute inset-x-4 top-1 h-3 rounded-full bg-black/20 blur-sm" />
                            </motion.div>

                            <motion.div
                                aria-hidden="true"
                                initial={{ scaleY: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                transition={{ duration: 0.85, delay: sproutDelay, ease: [0.175, 0.885, 0.32, 1.15] }}
                                className="absolute bottom-[78px] flex origin-bottom flex-col items-center md:bottom-[86px]"
                            >
                                <motion.div
                                    animate={prefersReducedMotion ? { y: 0 } : { y: [0, -2, 0, 2, 0] }}
                                    transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: sequenceStart }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="h-24 w-2 rounded-full bg-gradient-to-t from-green-700 via-green-500 to-green-300 shadow-[0_0_14px_rgba(34,197,94,0.22)] md:h-28" />

                                    <motion.div
                                        initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.2, rotate: prefersReducedMotion ? -32 : -4 }}
                                        animate={
                                            prefersReducedMotion
                                                ? { opacity: 1, scale: 1, rotate: -32, y: 0 }
                                                : { opacity: 1, scale: 1, rotate: -32, y: [0, -2, 0, 2, 0] }
                                        }
                                        transition={{
                                            duration: prefersReducedMotion ? 0.01 : 0.75,
                                            delay: prefersReducedMotion ? 0 : 3.72,
                                            ease: [0.22, 1, 0.36, 1],
                                            y: { duration: 4.1, repeat: Infinity, ease: 'easeInOut', delay: 4.8 }
                                        }}
                                        className="absolute left-1/2 top-7 h-10 w-16 -translate-x-[95%] rounded-[100%_0_100%_0/100%_0_100%_0] border border-green-300/30 bg-gradient-to-br from-green-300 to-green-600 shadow-[0_0_18px_rgba(34,197,94,0.24)]"
                                    />

                                    <motion.div
                                        initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.2, rotate: prefersReducedMotion ? 34 : 6 }}
                                        animate={
                                            prefersReducedMotion
                                                ? { opacity: 1, scale: 1, rotate: 34, y: 0 }
                                                : { opacity: 1, scale: 1, rotate: 34, y: [0, 2, 0, -2, 0] }
                                        }
                                        transition={{
                                            duration: prefersReducedMotion ? 0.01 : 0.78,
                                            delay: prefersReducedMotion ? 0 : 3.88,
                                            ease: [0.22, 1, 0.36, 1],
                                            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 4.95 }
                                        }}
                                        className="absolute left-1/2 top-11 h-9 w-14 translate-x-[5%] rounded-[0_100%_0_100%/0_100%_0_100%] border border-green-300/30 bg-gradient-to-br from-green-300 to-green-600 shadow-[0_0_18px_rgba(34,197,94,0.24)]"
                                    />

                                    <motion.div
                                        initial={{ opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.2, rotate: prefersReducedMotion ? -6 : 0 }}
                                        animate={
                                            prefersReducedMotion
                                                ? { opacity: 1, scale: 1, rotate: -6 }
                                                : { opacity: 1, scale: 1, rotate: -6, y: [0, -1, 0, 1, 0] }
                                        }
                                        transition={{
                                            duration: prefersReducedMotion ? 0.01 : 0.58,
                                            delay: prefersReducedMotion ? 0 : 4.12,
                                            ease: [0.22, 1, 0.36, 1],
                                            y: { duration: 4.3, repeat: Infinity, ease: 'easeInOut', delay: 5.05 }
                                        }}
                                        className="absolute -top-1 h-5 w-5 rounded-full bg-green-300/75 blur-[6px]"
                                    />
                                </motion.div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={titleVariant}
                            transition={{ delay: sequenceStart + 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="max-w-3xl text-center"
                        >
                            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                                Grow with
                                <span className="block bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                                    Kisaan Konnect
                                </span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={subtitleVariant}
                            transition={{ delay: sequenceStart + 0.5, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-4 max-w-2xl text-center text-base text-gray-400 md:text-lg"
                        >
                            Personalized crop guidance, local market intelligence, and AI-powered farming support in one calm, connected experience.
                        </motion.p>

                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={actionVariant}
                            transition={{ delay: sequenceStart + 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 }}
                            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
                        >
                            <motion.button
                                variants={buttonVariant}
                                type="button"
                                onClick={() => navigate('/login')}
                                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-gray-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:ring-offset-2 focus:ring-offset-[#121212]"
                            >
                                Login
                            </motion.button>
                            <motion.button
                                variants={buttonVariant}
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-900/25 transition hover:from-green-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-green-500/60 focus:ring-offset-2 focus:ring-offset-[#121212]"
                            >
                                Sign Up
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
