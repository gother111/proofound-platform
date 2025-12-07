import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, AlertCircle, TrendingUp, Users, ShieldCheck, Briefcase } from 'lucide-react';
import { DashboardClient } from './DashboardClient';
import type { DashboardMetrics } from '@/lib/dashboard/metrics';

interface DashboardViewProps {
    user: any;
    metrics: DashboardMetrics;
    kpiCards: any[];
    heroStats: any[];
}

export function DashboardView({ user, metrics, kpiCards, heroStats }: DashboardViewProps) {
    const userName = user.displayName || user.handle || 'there';
    const firstName = userName.split(' ')[0];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 50,
                damping: 15,
            },
        },
    };

    return (
        <div className="min-h-screen bg-proofound-parchment relative overflow-hidden">
            {/* Subtle details for texture */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")` }}
            />

            <motion.div
                className="max-w-[1400px] mx-auto px-4 py-8 relative z-10 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Hero Section */}
                <motion.section
                    variants={itemVariants}
                    className="rounded-2xl p-8 text-white relative overflow-hidden shadow-lg group"
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-proofound-forest via-[#2D5F4A] to-proofound-forest z-0" />

                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700" />

                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-4 max-w-xl">
                            <h1 className="text-4xl font-display font-medium tracking-wide">
                                Welcome back, {firstName}
                            </h1>
                            <p className="text-white/90 text-lg font-light leading-relaxed max-w-md">
                                You have <span className="font-semibold text-white">{metrics.qualityMatches} high-fit matches</span> and{' '}
                                <span className="font-semibold text-white">{metrics.pendingVerifications} verification{metrics.pendingVerifications === 1 ? '' : 's'}</span> awaiting review.
                            </p>

                            <div className="pt-2">
                                <Link href="/app/i/profile">
                                    <Button
                                        size="default"
                                        className="bg-white text-proofound-forest hover:bg-proofound-parchment border-none shadow-md transition-transform hover:-translate-y-0.5"
                                    >
                                        Complete your profile
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats in Hero */}
                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            {heroStats.map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 transition-colors hover:bg-white/20">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-display font-medium">{value}</div>
                                        <div className="text-xs text-white/70 uppercase tracking-wider font-medium">{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* KPI Grid */}
                <motion.section
                    variants={containerVariants}
                    className="grid grid-cols-1 gap-6 md:grid-cols-3"
                >
                    {kpiCards.map((card, index) => {
                        const Icon = card.Icon;
                        return (
                            <motion.div key={card.title} variants={itemVariants}>
                                <Card className="h-full p-6 glass-card hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-proofound-stone/60 group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-2.5 rounded-xl ${card.title === 'Pending Verifications' ? 'bg-[#D4A574]/10 text-[#D4A574]' : card.title === 'Active Applications' ? 'bg-proofound-terracotta/10 text-proofound-terracotta' : 'bg-proofound-forest/10 text-proofound-forest'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        {card.title === 'Pending Verifications' ? (
                                            <AlertCircle className="w-5 h-5 text-[#D4A574]" />
                                        ) : (
                                            <TrendingUp className="w-5 h-5 text-proofound-forest" />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-4xl font-display font-medium text-proofound-charcoal">
                                            {card.value}
                                        </p>
                                        <p className="text-sm font-medium text-muted-foreground/80">
                                            {card.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-proofound-stone/40">
                                        {card.ctaHref ? (
                                            <Link
                                                href={card.ctaHref}
                                                className="inline-flex items-center text-sm font-semibold text-proofound-forest hover:text-proofound-forest/80 transition-colors group-hover:translate-x-1 duration-200"
                                            >
                                                {card.ctaLabel ?? 'Review now'} <ArrowRight className="w-4 h-4 ml-1" />
                                            </Link>
                                        ) : (
                                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                {card.footnote}
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.section>

                {/* Customizable Dashboard Widgets */}
                <motion.div variants={itemVariants}>
                    <DashboardClient />
                </motion.div>
            </motion.div>
        </div>
    );
}
