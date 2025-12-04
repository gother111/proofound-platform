import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Eye, Sparkles, Leaf, Plus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Value } from '@/types/profile';

interface PurposeBlockProps {
    mission?: string | null;
    vision?: string | null;
    values: Value[];
    causes: string[];
    onEditMission: () => void;
    onEditVision: () => void;
    onEditValues: () => void;
    onEditCauses: () => void;
}

export function PurposeBlock({
    mission,
    vision,
    values,
    causes,
    onEditMission,
    onEditVision,
    onEditValues,
    onEditCauses,
}: PurposeBlockProps) {
    return (
        <Card className="p-6 border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sage via-proofound-terracotta to-teal" />

            <div className="mb-6">
                <h2 className="text-2xl font-display font-semibold text-proofound-charcoal dark:text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-proofound-terracotta" />
                    Purpose & Values
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    The core drivers behind your work and impact.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mission & Vision Column */}
                <div className="space-y-6">
                    {/* Mission */}
                    <div className="relative group/item">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-sage/10 text-sage">
                                    <Target className="w-4 h-4" />
                                </div>
                                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Mission</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditMission}
                                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                                <Edit3 className="w-3 h-3" />
                            </Button>
                        </div>
                        {mission ? (
                            <p className="text-base leading-relaxed text-foreground font-display italic">
                                &ldquo;{mission}&rdquo;
                            </p>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditMission}
                                className="text-muted-foreground hover:text-sage text-sm h-auto p-0"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add your mission
                            </Button>
                        )}
                    </div>

                    {/* Vision */}
                    <div className="relative group/item">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-teal/10 text-teal">
                                    <Eye className="w-4 h-4" />
                                </div>
                                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Vision</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditVision}
                                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                                <Edit3 className="w-3 h-3" />
                            </Button>
                        </div>
                        {vision ? (
                            <p className="text-base leading-relaxed text-foreground font-display italic">
                                &ldquo;{vision}&rdquo;
                            </p>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditVision}
                                className="text-muted-foreground hover:text-teal text-sm h-auto p-0"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add your vision
                            </Button>
                        )}
                    </div>
                </div>

                {/* Values & Causes Column */}
                <div className="space-y-6">
                    {/* Values */}
                    <div className="relative group/item">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-proofound-terracotta/10 text-proofound-terracotta">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Core Values</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditValues}
                                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                                <Edit3 className="w-3 h-3" />
                            </Button>
                        </div>
                        {values.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {values.map((value) => (
                                    <Badge
                                        key={value.id}
                                        variant="secondary"
                                        className="bg-proofound-terracotta/10 text-proofound-terracotta hover:bg-proofound-terracotta/20 border-0 px-3 py-1"
                                    >
                                        {value.label}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditValues}
                                className="text-muted-foreground hover:text-proofound-terracotta text-sm h-auto p-0"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Define values
                            </Button>
                        )}
                    </div>

                    {/* Causes */}
                    <div className="relative group/item">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-sage/10 text-sage">
                                    <Leaf className="w-4 h-4" />
                                </div>
                                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Causes</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditCauses}
                                className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                                <Edit3 className="w-3 h-3" />
                            </Button>
                        </div>
                        {causes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {causes.map((cause, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-sage/10 text-sage hover:bg-sage/20 border-0 px-3 py-1"
                                    >
                                        {cause}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onEditCauses}
                                className="text-muted-foreground hover:text-sage text-sm h-auto p-0"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add causes
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
