import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Dimensions, TouchableOpacity, Pressable, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { OfflineNotification } from './OfflineNotification';

// Core Dimensions
const { width, height } = Dimensions.get('window');

interface Props {
    isPortalOpen?: boolean;
    onEnter?: () => void;
    onCheat?: () => void;
}

// Particle Helper
const STARDUST_COUNT = 22;
const generateStardust = () => {
    return Array.from({ length: STARDUST_COUNT }).map((_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.05 + 0.02,
    }));
};

export const ClosedState: React.FC<Props> = ({ isPortalOpen = false, onEnter, onCheat }) => {
    const insets = useSafeAreaInsets();
    const [showAlert, setShowAlert] = useState(false);
    const [isEntering, setIsEntering] = useState(false);

    // Core Background Pulse
    const glowAnim = useRef(new Animated.Value(0)).current;
    const titleFade = useRef(new Animated.Value(0)).current;

    // Portal Lifecycle (Convergence -> Rise)
    const morphWidth = useRef(new Animated.Value(0)).current;
    const morphRise = useRef(new Animated.Value(0)).current;
    const haloBreath = useRef(new Animated.Value(0)).current;

    // V24 Singularity Masterpiece Anims
    const entryProgress = useRef(new Animated.Value(0)).current;
    const surfaceAlpha = useRef(new Animated.Value(1)).current;
    const pressScale = useRef(new Animated.Value(1)).current;
    const energyVibration = useRef(new Animated.Value(0)).current;
    const vignetteOpacity = useRef(new Animated.Value(0)).current;

    // Stardust Lifecycle
    const stardustNodes = useMemo(() => generateStardust(), []);
    const stardustAnim = useRef(new Animated.Value(0)).current;

    // Standard Alert Anims
    const alertScale = useRef(new Animated.Value(0.9)).current;
    const alertOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Atmosphere & Stardust Pulse
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 12000, useNativeDriver: false }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 12000, useNativeDriver: false }),
                ]),
                // Removed redundant stardustAnim loop
            ])
        ).start();

        // Reveal Brand
        Animated.timing(titleFade, {
            toValue: 1,
            duration: 3500,
            delay: 800,
            useNativeDriver: false,
        }).start();

        // Portal "Resonance"
        Animated.loop(
            Animated.sequence([
                Animated.timing(haloBreath, { toValue: 1, duration: 4000, useNativeDriver: false }),
                Animated.timing(haloBreath, { toValue: 0, duration: 4000, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    // Sequenced Portal Formation
    useEffect(() => {
        if (isPortalOpen) {
            Animated.sequence([
                Animated.timing(morphWidth, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: false,
                }),
                Animated.timing(morphRise, {
                    toValue: 1,
                    duration: 4500,
                    easing: Easing.bezier(0.2, 0.8, 0.4, 1),
                    useNativeDriver: false,
                })
            ]).start();
        }
    }, [isPortalOpen]);


    const handlePressIn = () => {
        if (isEntering) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Animated.parallel([
            Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: false }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(energyVibration, { toValue: 1, duration: 50, useNativeDriver: false }),
                    Animated.timing(energyVibration, { toValue: -1, duration: 50, useNativeDriver: false }),
                ])
            )
        ]).start();
    };

    const handlePressOut = () => {
        if (isEntering) return;
        Animated.parallel([
            Animated.spring(pressScale, { toValue: 1, useNativeDriver: false }),
            Animated.timing(energyVibration, { toValue: 0, duration: 100, useNativeDriver: false })
        ]).start();
    };

    const handlePortalInteraction = () => {
        if (isEntering) return;

        if (isPortalOpen) {
            setIsEntering(true);
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Singularity Journey (V24)
            Animated.parallel([
                Animated.timing(entryProgress, {
                    toValue: 1,
                    duration: 5800,
                    easing: Easing.bezier(0.3, 0.1, 0.2, 1),
                    useNativeDriver: false,
                }),
                Animated.timing(surfaceAlpha, {
                    toValue: 0,
                    duration: 1800,
                    useNativeDriver: false,
                }),
                Animated.timing(vignetteOpacity, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: false,
                }),
                Animated.spring(pressScale, {
                    toValue: 1.25,
                    tension: 5,
                    friction: 2,
                    useNativeDriver: false,
                })
            ]).start(() => {
                onEnter?.();
            });
            return;
        }

        setShowAlert(true);
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        Animated.parallel([
            Animated.spring(alertScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false }),
            Animated.timing(alertOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
        ]).start();
    };

    const closeAlert = () => {
        Animated.parallel([
            Animated.timing(alertScale, { toValue: 0.95, duration: 200, useNativeDriver: false }),
            Animated.timing(alertOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start(() => setShowAlert(false));
    };

    // Interpolations
    const buttonWidth = morphWidth.interpolate({
        inputRange: [0, 1],
        outputRange: [240, 56]
    });

    const paddingBottom = Math.max(insets.bottom, 40);
    const originY = height - (paddingBottom + 28);
    // V24: Perfect Optical Grounding
    const targetY = height * 0.58;
    const riseDelta = targetY - originY;

    const portalTranslateY = morphRise.interpolate({
        inputRange: [0, 1],
        outputRange: [0, riseDelta]
    });

    const brandAlpha = morphWidth.interpolate({
        inputRange: [0.3, 0.8],
        outputRange: [1, 0]
    });

    const labelAlpha = morphWidth.interpolate({
        inputRange: [0, 0.4],
        outputRange: [1, 0]
    });

    // Singularity Warp Logic
    const backgroundScale = entryProgress.interpolate({
        inputRange: [0, 0.45, 1],
        outputRange: [1, 1, 1.4]
    });

    const titleZoom = entryProgress.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [1, 1, 3.5]
    });

    const titleMotionAlpha = entryProgress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [1, 0.8, 0]
    });

    return (
        <View style={styles.container}>
            <OfflineNotification />
            <LinearGradient colors={['#010103', '#050510', '#010103']} style={StyleSheet.absoluteFillObject} />

            {/* Stardust Parallax Layer */}
            {stardustNodes.map(star => (
                <Animated.View key={star.id} style={[
                    styles.stardust,
                    {
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        opacity: Animated.multiply(star.opacity, entryProgress.interpolate({
                            inputRange: [0, 0.1, 0.8, 1],
                            outputRange: [0, 1, 1, 0]
                        })),
                        transform: [
                            { scale: backgroundScale },
                            {
                                translateX: entryProgress.interpolate({
                                    inputRange: [0.3, 1],
                                    outputRange: [0, (star.x - width / 2) * 2]
                                })
                            },
                            {
                                translateY: entryProgress.interpolate({
                                    inputRange: [0.3, 1],
                                    outputRange: [0, (star.y - height / 2) * 2]
                                })
                            }
                        ]
                    }
                ]} />
            ))}

            {/* Atmospheric Drifting Voids */}
            <Animated.View style={[
                styles.glow,
                {
                    top: '15%', right: '-10%', backgroundColor: '#151550',
                    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.06] }),
                    transform: [{ scale: backgroundScale }, { rotate: glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) }]
                }
            ]} />
            <Animated.View style={[
                styles.glow,
                {
                    bottom: '15%', left: '-10%', backgroundColor: '#202060',
                    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.06] }),
                    transform: [{ scale: backgroundScale }, { rotate: glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-15deg'] }) }]
                }
            ]} />

            <View style={[styles.main, { paddingBottom: paddingBottom }]}>
                {/* Branding: Kinetic Dissolve */}
                <Animated.View style={[
                    styles.header,
                    {
                        opacity: Animated.multiply(Animated.multiply(titleFade, brandAlpha), titleMotionAlpha),
                        marginTop: Math.max(height * 0.22, 120),
                        transform: [{ scale: titleZoom }]
                    }
                ]}>
                    <View>
                        <Text style={styles.brandTitle}>AFTER MIDNIGHT</Text>
                    </View>
                    <Text style={styles.brandMantra}>a shared night space</Text>
                </Animated.View>

                {/* The Singularity Hub */}
                <Animated.View style={{
                    width: '100%',
                    alignItems: 'center',
                    transform: [
                        { translateY: portalTranslateY },
                        { scale: pressScale },
                        { translateX: energyVibration.interpolate({ inputRange: [-1, 1], outputRange: [-0.5, 0.5] }) }
                    ],
                }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={handlePortalInteraction}
                        style={styles.portalPlatform}
                    >
                        <View style={styles.portalBoundary}>
                            <Animated.View style={[styles.portalCore, { width: buttonWidth, opacity: surfaceAlpha }]}>
                                {/* Singularity Layer 1: The Resonance Halo */}
                                <Animated.View style={[
                                    styles.halo,
                                    {
                                        opacity: Animated.multiply(morphWidth, haloBreath.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.4] })),
                                        transform: [{ scale: haloBreath.interpolate({ inputRange: [0, 1], outputRange: [1.2, 3.5] }) }]
                                    }
                                ]} />

                                {/* Singularity Layer 2: The Corona */}
                                <Animated.View style={[
                                    styles.pearlAtmosphere,
                                    {
                                        opacity: morphWidth.interpolate({ inputRange: [0.95, 1], outputRange: [0, 0.3] }),
                                        transform: [{ scale: haloBreath.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.8] }) }]
                                    }
                                ]} />

                                {/* Singularity Layer 3: The Nucleus */}
                                <Animated.View style={[
                                    styles.pearl,
                                    {
                                        opacity: morphWidth.interpolate({ inputRange: [0.95, 1], outputRange: [0, 1] }),
                                        transform: [{ scale: haloBreath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
                                    }
                                ]} />

                                {/* Information Label */}
                                <Animated.View style={[styles.labelGroup, { opacity: labelAlpha }]}>
                                    <View style={styles.stateDot} />
                                    <Text style={styles.stateLabel}>PORTAL STATUS: <Text style={styles.stateValue}>LOCKED</Text></Text>
                                </Animated.View>
                            </Animated.View>

                            {/* V24 Singularity Gateway: Absolute Center Transition */}
                            {isEntering && (
                                <View style={styles.entryOverlay}>
                                    <View style={styles.gatewayHub}>

                                        {/* Background Lens Flare */}
                                        <Animated.View style={[
                                            styles.lensFlare,
                                            {
                                                opacity: entryProgress.interpolate({
                                                    inputRange: [0, 0.4, 0.42, 0.5],
                                                    outputRange: [0, 0, 0.15, 0]
                                                }),
                                                transform: [{ rotate: '45deg' }, { scaleX: entryProgress.interpolate({ inputRange: [0.4, 0.42, 1], outputRange: [0, 8, 0] }) }]
                                            }
                                        ]} />

                                        {/* 1. Luminous Veil (Etheric Trail) - Softened and Crystalline */}
                                        <Animated.View style={[
                                            styles.needle,
                                            {
                                                height: 12, // Base height
                                                width: 12, // Base width
                                                opacity: entryProgress.interpolate({
                                                    inputRange: [0, 0.1, 0.4, 0.6, 1],
                                                    outputRange: [0, 0.2, 0.6, 0.2, 0]
                                                }),
                                                backgroundColor: '#e0f0ff',
                                                borderRadius: 4,
                                                transform: [
                                                    {
                                                        scaleX: entryProgress.interpolate({
                                                            inputRange: [0, 0.3, 0.45, 1],
                                                            outputRange: [1, 1, 80, 150] // Sczaled from 12px base
                                                        })
                                                    },
                                                    {
                                                        scaleY: entryProgress.interpolate({
                                                            inputRange: [0, 0.43, 1],
                                                            outputRange: [1, 100, 180] // Scaled from 12px base
                                                        })
                                                    }
                                                ],
                                                filter: Platform.OS === 'web' ? [{ blur: 40 }] as any : undefined,
                                            }
                                        ]} />

                                        {/* 2. Prismatic Singularity (The "Door" - Transitioning from Heat to Crystalline) */}
                                        <Animated.View style={[
                                            styles.needle,
                                            {
                                                height: 12,
                                                width: 12,
                                                backgroundColor: entryProgress.interpolate({
                                                    inputRange: [0.45, 0.7, 1],
                                                    outputRange: ['#ffffff', '#f0f8ff', '#010103']
                                                }),
                                                opacity: entryProgress.interpolate({
                                                    inputRange: [0, 0.05, 0.45, 0.8, 1],
                                                    outputRange: [0, 1, 1, 0.8, 0]
                                                }),
                                                transform: [
                                                    {
                                                        scaleX: entryProgress.interpolate({
                                                            inputRange: [0, 0.04, 0.4, 0.48, 1],
                                                            outputRange: [1, 0.8, 0.3, 30, 90] // Scaled relative to 12px
                                                        })
                                                    },
                                                    {
                                                        scaleY: entryProgress.interpolate({
                                                            inputRange: [0, 0.45, 1],
                                                            outputRange: [1, 120, 160] // Scaled relative to 12px
                                                        })
                                                    }
                                                ]
                                            }
                                        ]} />

                                        {/* 3. Prismatic Bloom (Soft Environmental Flash) */}
                                        <Animated.View style={[
                                            styles.prismaticBloom,
                                            {
                                                opacity: entryProgress.interpolate({
                                                    inputRange: [0, 0.4, 0.46, 0.7, 1],
                                                    outputRange: [0, 0, 0.8, 0.3, 0]
                                                }),
                                                transform: [{ scale: entryProgress.interpolate({ inputRange: [0.4, 1], outputRange: [1, 2.5] }) }]
                                            }
                                        ]} />

                                        {/* 4. Shockwave Flash (Resolution) */}
                                        <Animated.View style={[
                                            styles.shockwave,
                                            {
                                                transform: [
                                                    {
                                                        scale: entryProgress.interpolate({
                                                            inputRange: [0, 0.4, 0.45, 0.8, 1],
                                                            outputRange: [0, 0, 2, 5, 10]
                                                        })
                                                    }
                                                ],
                                                opacity: entryProgress.interpolate({
                                                    inputRange: [0, 0.4, 0.45, 0.9, 1],
                                                    outputRange: [0, 0, 1, 0.3, 0]
                                                }),
                                                borderWidth: entryProgress.interpolate({
                                                    inputRange: [0.4, 1],
                                                    outputRange: [15, 0]
                                                })
                                            }
                                        ]} />
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    <Animated.Text style={[styles.cta, { opacity: Animated.multiply(surfaceAlpha, morphRise.interpolate({ inputRange: [0.9, 1], outputRange: [0, 0.45] })) }]}>
                        Enter the Void
                    </Animated.Text>
                </Animated.View>
            </View>

            {/* Edge Refraction Vignette */}
            <Animated.View style={[styles.vignette, { opacity: vignetteOpacity }]} />

            {/* Alert Layer */}
            {showAlert && (
                <View style={styles.alertStack}>
                    <Pressable style={styles.alertDimmer} onPress={closeAlert} />
                    <Animated.View style={[styles.alertGlass, { opacity: alertOpacity, transform: [{ scale: alertScale }] }]}>
                        <Text style={styles.alertHeader}>LATE NIGHT EXCLUSIVE</Text>
                        <Text style={styles.alertSub}>The portal to our shared space only opens in the quietest hours (12 AM - 4 AM).</Text>
                        <TouchableOpacity onPress={closeAlert} style={styles.alertAction}>
                            <Text style={styles.alertActionText}>Acknowledge</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
};

// Responsive Scaling Helper
const screenScale = width / 380;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#010103', overflow: 'hidden' },
    stardust: { position: 'absolute', backgroundColor: '#fff', borderRadius: 1 },
    glow: { position: 'absolute', width: 500, height: 500, borderRadius: 250 },
    main: { flex: 1, alignItems: 'center', width: '100%', justifyContent: 'space-between' },
    header: { alignItems: 'center', paddingHorizontal: 20 },
    brandTitle: {
        color: '#fff',
        fontSize: Math.floor(24 * screenScale),
        fontWeight: '200',
        letterSpacing: Math.floor(12 * screenScale),
        textTransform: 'uppercase',
        textAlign: 'center'
    },
    brandMantra: { color: 'rgba(255,255,255,0.15)', fontSize: Math.max(8, 10 * screenScale), fontWeight: '300', letterSpacing: 6 * screenScale, marginTop: 18, textAlign: 'center' },
    portalPlatform: { width: 'auto' },
    portalBoundary: { justifyContent: 'center', alignItems: 'center' },
    portalCore: {
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    pearl: {
        position: 'absolute',
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#fff',
        ...Platform.select({
            web: { boxShadow: '0 0 25px #fff, 0 0 50px rgba(255,255,255,0.5)' },
            default: { shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 18, elevation: 10 }
        })
    },
    pearlAtmosphere: {
        position: 'absolute',
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    halo: {
        position: 'absolute',
        width: 30, height: 30, borderRadius: 15,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    labelGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30 },
    stateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 18 },
    stateLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '300', letterSpacing: 2.5 },
    stateValue: { color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
    cta: { color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 8, fontWeight: '300', textTransform: 'uppercase', marginTop: 35 },
    gatewayHub: { width: '100%', justifyContent: 'center', alignItems: 'center' },
    needle: {
        position: 'absolute',
        backgroundColor: '#fff',
        ...Platform.select({
            web: { boxShadow: '0 0 45px rgba(255,255,255,0.7)' },
            default: { shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 30, elevation: 15 }
        })
    },
    prismaticBloom: {
        position: 'absolute',
        width: width * 1.5,
        height: height * 0.8,
        backgroundColor: '#fff',
        borderRadius: width,
        filter: Platform.OS === 'web' ? [{ blur: 60 }] as any : undefined,
    },
    shockwave: {
        position: 'absolute',
        width: 100, height: 100, borderRadius: 50,
        borderColor: '#fff',
    },
    gatewayAura: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    lensFlare: { position: 'absolute', width: width * 3, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', opacity: 0, pointerEvents: 'none' },
    entryOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, pointerEvents: 'none' },
    alertStack: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    alertDimmer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
    alertGlass: { width: '85%', maxWidth: 320, backgroundColor: '#050508', borderRadius: 32, padding: 36, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    alertHeader: { color: '#fff', fontSize: 14, fontWeight: '300', letterSpacing: 3, marginBottom: 15 },
    alertSub: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', lineHeight: 18, marginBottom: 32, letterSpacing: 1 },
    alertAction: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    alertActionText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }
});
