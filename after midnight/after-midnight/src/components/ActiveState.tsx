import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated, Dimensions, Easing, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { postMessage, subscribeToMessages, Message, hasUserPosted, getUserId, reportMessage } from '../services/firebase';
import { OfflineNotification } from './OfflineNotification';

const { width, height } = Dimensions.get('window');

interface Props {
    timeRemaining: string;
    coolingFactor: number;
}

// Helper for safe color manipulation
const withOpacity = (color: string, opacity: number): string => {
    if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }
    return color; // Fallback if it's already an unexpected format (though interpolateColor returns rgba)
};

// Seeded random for consistent orb positions
const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// V42: ThoughtOrb Component - Ethereal Constellation Star
const ThoughtOrb = ({ message, position, color, onPress }: {
    message: Message,
    position: { x: number, y: number },
    color: string,
    onPress: () => void
}) => {
    const breathAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const coronaAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const driftX = useRef(new Animated.Value(0)).current;
    const driftY = useRef(new Animated.Value(0)).current;

    // Unique random values for each star
    const starSeed = useMemo(() => hashCode(message.id), [message.id]);
    const driftAmount = useMemo(() => 1.5 + (seededRandom(starSeed) * 2.5), [starSeed]);
    const breathSpeed = useMemo(() => 2500 + (seededRandom(starSeed + 1) * 2500), [starSeed]);
    const intensity = useMemo(() => 0.6 + (seededRandom(starSeed + 2) * 0.4), [starSeed]);

    useEffect(() => {
        // Entry animation with crystalline fade-in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1800,
            delay: seededRandom(starSeed + 3) * 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Breathing loop (organic, living quality)
        Animated.loop(
            Animated.sequence([
                Animated.timing(breathAnim, {
                    toValue: 1,
                    duration: breathSpeed,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(breathAnim, {
                    toValue: 0,
                    duration: breathSpeed,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true
                }),
            ])
        ).start();

        // Corona pulse (ethereal expansion)
        Animated.loop(
            Animated.sequence([
                Animated.timing(coronaAnim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(coronaAnim, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
            ])
        ).start();

        // Shimmer rotation (prismatic quality)
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();

        // Gentle drift animation (floating in void)
        Animated.loop(
            Animated.sequence([
                Animated.timing(driftX, {
                    toValue: driftAmount,
                    duration: 5000 + (seededRandom(starSeed + 4) * 3000),
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(driftX, {
                    toValue: -driftAmount,
                    duration: 5000 + (seededRandom(starSeed + 5) * 3000),
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(driftY, {
                    toValue: driftAmount * 0.7,
                    duration: 6000 + (seededRandom(starSeed + 6) * 2000),
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(driftY, {
                    toValue: -driftAmount * 0.7,
                    duration: 6000 + (seededRandom(starSeed + 7) * 2000),
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
            ])
        ).start();
    }, []);

    const size = useMemo(() => {
        const len = message.text.length;
        // Delicate, jewel-like sizes
        if (len < 30) return 6;
        if (len < 60) return 8;
        if (len < 100) return 10;
        return 12;
    }, [message.text.length]);

    const coreOpacity = breathAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.7 * intensity, 1 * intensity, 0.7 * intensity]
    });

    const coronaScale = coronaAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4]
    });

    const coronaOpacity = coronaAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.2, 0.4, 0.2]
    });

    const shimmerRotation = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    return (
        <Animated.View style={[
            styles.starContainer,
            {
                left: position.x,
                top: position.y,
                opacity: fadeAnim,
                transform: [
                    { translateX: driftX },
                    { translateY: driftY }
                ]
            }
        ]}>
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.starTouchable,
                    { transform: [{ scale: pressed ? 1.5 : 1 }] }
                ]}
            >
                {/* Subtle outer glow */}
                <Animated.View style={[
                    styles.starHalo,
                    {
                        width: size * 4,
                        height: size * 4,
                        borderRadius: size * 2,
                        backgroundColor: `${color}12`,
                        opacity: coreOpacity.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0.2, 0.4]
                        }),
                        ...Platform.select({
                            web: {
                                boxShadow: `0 0 ${size * 2}px ${color}40`,
                            },
                            default: {
                                shadowColor: color,
                                shadowOpacity: 0.4,
                                shadowRadius: size,
                                shadowOffset: { width: 0, height: 0 },
                            }
                        })
                    }
                ]} />

                {/* Sharp core point */}
                <Animated.View style={[
                    styles.starCore,
                    {
                        width: size,
                        height: size,
                        borderRadius: size * 0.5,
                        backgroundColor: '#fff',
                        opacity: coreOpacity,
                        transform: [{ scale: breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }],
                        ...Platform.select({
                            web: {
                                boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size}px #fff`,
                            },
                            default: {
                                shadowColor: '#fff',
                                shadowOpacity: 0.9,
                                shadowRadius: size,
                                shadowOffset: { width: 0, height: 0 },
                            }
                        })
                    }
                ]} />
            </Pressable>
        </Animated.View>
    );
};

// V42: Reveal Modal Component - Now with smooth exit transitions
const RevealModal = ({ visible, message, color, reportMessage, onClose }: {
    visible: boolean,
    message: Message | null,
    color: string,
    reportMessage: (id: string) => void,
    onClose: () => void
}) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [renderingMessage, setRenderingMessage] = useState<Message | null>(null);

    useEffect(() => {
        if (message) {
            setRenderingMessage(message);
            // Entrance: Elastic spring + fade gain
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true
                }),
            ]).start();
        }
    }, [message]);

    const handleDismiss = () => {
        // Exit: Smooth shrink + fade dissolve
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 250,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
        ]).start(() => {
            onClose(); // Reset parent state
            setRenderingMessage(null); // Cleanup local render
        });
    };

    if (!renderingMessage) return null;

    const timeStr = renderingMessage.createdAt
        ? renderingMessage.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'now';

    const shadowStyle = Platform.OS === 'web'
        ? { textShadow: `0px 0px 10px ${color}` }
        : { textShadowColor: color, textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } };

    return (
        <Modal transparent visible={visible && renderingMessage !== null} animationType="none" onRequestClose={handleDismiss}>
            <Pressable style={styles.modalBackdrop} onPress={handleDismiss}>
                <Animated.View style={[
                    styles.revealCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}>
                    <LinearGradient
                        colors={['rgba(30, 30, 40, 0.98)', 'rgba(15, 15, 25, 1)']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.reportBtn,
                            { opacity: pressed ? 1 : 0.2 }
                        ]}
                        onPress={() => {
                            reportMessage(renderingMessage.id);
                            handleDismiss();
                            if (Platform.OS !== 'web') {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }
                        }}
                    >
                        <Ionicons name="flag-outline" size={14} color={color} />
                    </Pressable>

                    <Pressable onPress={(e) => e.stopPropagation()} style={styles.revealContent}>
                        <Text style={[styles.revealText, shadowStyle]}>
                            {renderingMessage.text}
                        </Text>

                        <View style={styles.revealFooter}>
                            <View style={[styles.footerLine, { backgroundColor: withOpacity(color, 0.08) }]} />
                            <Text style={[styles.revealTime, { color: withOpacity(color, 0.5) }]}>
                                {timeStr}
                            </Text>
                            <View style={[styles.footerLine, { backgroundColor: withOpacity(color, 0.08) }]} />
                        </View>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};

export const ActiveState: React.FC<Props> = ({ timeRemaining, coolingFactor }) => {
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [userHasPosted, setUserHasPosted] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [postError, setPostError] = useState<string>('');

    const glowAnim = useRef(new Animated.Value(0)).current;
    const composerAnim = useRef(new Animated.Value(0)).current;
    const arrivalAnim = useRef(new Animated.Value(0)).current;
    const arrivalFlash = useRef(new Animated.Value(1)).current;
    const stardustMelt = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const releaseAnim = useRef(new Animated.Value(0)).current;
    const btnFade = useRef(new Animated.Value(0)).current;

    const stardustNodes = useMemo(() => {
        return Array.from({ length: 24 }).map((_, i) => ({
            id: i,
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
        }));
    }, []);

    // Animate Release button visibility based on text input
    useEffect(() => {
        Animated.timing(btnFade, {
            toValue: inputText.trim() ? 1 : 0.4,
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.67, 1),
            useNativeDriver: true,
        }).start();
    }, [inputText]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(arrivalAnim, {
                toValue: 1,
                duration: 1800,
                easing: Easing.bezier(0.2, 0, 0, 1),
                useNativeDriver: true,
            }),
            Animated.timing(arrivalFlash, {
                toValue: 0,
                duration: 2200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(stardustMelt, {
                toValue: 1,
                duration: 3200,
                easing: Easing.out(Easing.poly(3)),
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, { toValue: 1, duration: 15000, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0, duration: 15000, useNativeDriver: true }),
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 3500,
                        easing: Easing.bezier(0.33, 0, 0.67, 1),
                        useNativeDriver: false
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 3500,
                        easing: Easing.bezier(0.33, 0, 0.67, 1),
                        useNativeDriver: false
                    }),
                ])
            )
        ]).start();

        const unsubscribe = subscribeToMessages(setMessages);

        // Check if user has already posted
        const checkUserStatus = async () => {
            const posted = await hasUserPosted();
            const userId = await getUserId();
            setUserHasPosted(posted);
            setCurrentUserId(userId);
        };

        checkUserStatus();
        return () => unsubscribe();
    }, []);

    const openComposer = () => {
        setIsComposing(true);
        Animated.timing(composerAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
        }).start();
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const closeComposer = () => {
        Animated.timing(composerAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            useNativeDriver: true,
        }).start(() => setIsComposing(false));
    };

    const handleCommit = async () => {
        if (inputText.trim()) {
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            const text = inputText.trim();

            // Release Sequence: Cinematic Animation (Softer Lift-off)
            Animated.timing(releaseAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true
            }).start(async () => {
                setInputText('');
                closeComposer();
                releaseAnim.setValue(0);

                const result = await postMessage(text);
                if (!result.success) {
                    setPostError(result.error || 'Failed to post message');
                    setTimeout(() => setPostError(''), 3000);
                } else {
                    setUserHasPosted(true);
                }
            });
        }
    };

    const interpolateColor = (factor: number) => {
        const r = Math.round(180 + factor * 75);
        const g = Math.round(190 + factor * 65);
        const b = 255;
        return `rgba(${r}, ${g}, ${b}, 0.9)`;
    };

    const dynamicColor = interpolateColor(coolingFactor);

    // V42: Calculate dynamic void depth (virtual height)
    const virtualHeight = useMemo(() => {
        const baseHeight = height - 250; // Visible area
        // Grow height if we have more than 8 stars to prevent overcrowding
        return Math.max(baseHeight, messages.length * 85);
    }, [messages.length]);

    const bokehOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.03, 0.08]
    });

    // V42: Calculate orb positions
    const orbPositions = useMemo(() => {
        const safeWidth = width - 120;
        const safeHeight = virtualHeight - 150; // Use virtual height for placement

        return messages.map((msg, index) => {
            const seed = hashCode(msg.id);
            const randX = seededRandom(seed);
            const randY = seededRandom(seed + 1);

            return {
                x: 60 + (randX * safeWidth),
                y: 100 + (randY * safeHeight),
            };
        });
    }, [messages, virtualHeight]);

    return (
        <View style={styles.container}>
            <OfflineNotification />

            <LinearGradient
                colors={['#010103', '#050510', '#010103']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Stardust Handoff */}
            {stardustNodes.map((star) => (
                <Animated.View key={star.id} style={[
                    styles.stardust,
                    {
                        left: star.x,
                        top: star.y,
                        width: star.size,
                        height: star.size,
                        opacity: stardustMelt.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [star.opacity, star.opacity, 0]
                        }),
                        transform: [
                            {
                                translateX: stardustMelt.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [(star.x - width / 2) * 0.4, (star.x - width / 2) * 1.5]
                                })
                            },
                            {
                                translateY: stardustMelt.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [(star.y - height / 2) * 0.4, (star.y - height / 2) * 1.5]
                                })
                            }
                        ]
                    }
                ]} />
            ))}

            {/* Elegant Atmospheric Radiance */}
            <Animated.View style={[
                styles.radialGlow,
                {
                    top: '5%', right: '5%',
                    width: 400, height: 400,
                    opacity: bokehOpacity.interpolate({ inputRange: [0.03, 0.08], outputRange: [0.02, 0.05] }),
                    transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
                }
            ]}>
                <LinearGradient
                    colors={[withOpacity(dynamicColor, 0.15), withOpacity(dynamicColor, 0.05), 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            <Animated.View style={[
                styles.radialGlow,
                {
                    bottom: '8%', left: '3%',
                    width: 450, height: 450,
                    opacity: bokehOpacity.interpolate({ inputRange: [0.03, 0.08], outputRange: [0.025, 0.055] }),
                    transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }]
                }
            ]}>
                <LinearGradient
                    colors={['#20206025', '#15155018', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0.5 }}
                    end={{ x: 0, y: 0 }}
                />
            </Animated.View>

            <Animated.View style={[
                styles.lightRay,
                {
                    top: '20%', right: '-20%',
                    width: 600, height: 2,
                    opacity: glowAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.01, 0.03, 0.01] }),
                    transform: [
                        { rotate: '-35deg' },
                        { scaleX: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['transparent', withOpacity(dynamicColor, 0.2), 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </Animated.View>

            <Animated.View style={{ flex: 1, opacity: arrivalAnim }}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 50) }]}>
                    <Text style={styles.brandTitle}>AFTER MIDNIGHT</Text>
                    <View style={styles.headerState}>
                        <View style={[styles.statusDot, { backgroundColor: dynamicColor }]} />
                        <Text style={[styles.timerLabel, { color: dynamicColor }]}>{timeRemaining}</Text>
                        <Text style={styles.timerSub}>REMAINING</Text>
                    </View>
                </View>

                {/* V42: The Constellation (Scrollable Deep Void) */}
                <ScrollView
                    style={styles.constellation}
                    contentContainerStyle={{ height: virtualHeight, paddingTop: 50, paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                    decelerationRate="normal"
                    scrollEventThrottle={16}
                >
                    {messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>The void is silent.</Text>
                            <Text style={styles.emptySubtext}>whisper your first thought.</Text>
                        </View>
                    ) : (
                        messages.map((msg, index) => (
                            <ThoughtOrb
                                key={msg.id}
                                message={msg}
                                position={orbPositions[index]}
                                color={dynamicColor}
                                onPress={() => setSelectedMessage(msg)}
                            />
                        ))
                    )}
                </ScrollView>

                {/* FAB: Soft Capsule with Stable Pulse */}
                <Animated.View style={[
                    styles.fabContainer,
                    {
                        paddingBottom: Math.max(insets.bottom, 40),
                        opacity: arrivalAnim,
                    }
                ]}>
                    <Pressable
                        onPress={userHasPosted ? undefined : openComposer}
                        style={({ pressed }) => [
                            styles.fabCapsule,
                            userHasPosted && styles.fabDisabled,
                            { opacity: pressed && !userHasPosted ? 0.7 : 1 }
                        ]}
                        disabled={userHasPosted}
                    >
                        {!userHasPosted && (
                            <Animated.View
                                style={[
                                    StyleSheet.absoluteFillObject,
                                    {
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        transform: [{ scale: pulseAnim }],
                                        opacity: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [0.4, 0.05] })
                                    }
                                ]}
                            />
                        )}
                        <Text style={[styles.fabText, userHasPosted && styles.fabTextDisabled]}>
                            {userHasPosted ? 'RELEASED' : 'RELEASE A THOUGHT'}
                        </Text>
                    </Pressable>
                </Animated.View>
            </Animated.View>

            {/* Error Notification */}
            {/* {postError && (
                <Animated.View style={styles.errorNotification}>
                    <Text style={styles.errorText}>{postError}</Text>
                </Animated.View>
            )} */}

            {/* Composer Modal - Ghostly Float Pivot */}
            <Modal transparent visible={isComposing} animationType="none">
                <Animated.View style={[styles.composerBackdrop, { opacity: composerAnim }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeComposer} />
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.composerKAV}>
                        <Animated.View style={[
                            styles.composerSheet,
                            {
                                opacity: composerAnim,
                                transform: [
                                    { scale: composerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }
                                ]
                            }
                        ]}>
                            <View style={styles.composerHeader}>
                                <Text style={styles.composerTitle}>MIDNIGHT VOID</Text>
                            </View>

                            <Animated.View style={[
                                styles.composerContent,
                                {
                                    opacity: releaseAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0] }),
                                    transform: [
                                        { scale: releaseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) },
                                        { translateY: releaseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) }
                                    ]
                                }
                            ]}>
                                <TextInput
                                    style={styles.composerInput}
                                    placeholder="Speak into the void..."
                                    placeholderTextColor="rgba(255,255,255,0.1)"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    maxLength={300}
                                    multiline
                                    autoFocus
                                    selectionColor={dynamicColor}
                                />
                                <View style={styles.composerFooter}>
                                    <Text style={styles.charCounter}>{inputText.length} / 300</Text>

                                    <View style={styles.floatingControls}>
                                        <Animated.View style={{ width: '100%', alignItems: 'center', opacity: btnFade }}>
                                            <Pressable
                                                onPress={handleCommit}
                                                disabled={!inputText.trim()}
                                                style={({ pressed }) => [
                                                    styles.bottomReleaseBtn,
                                                    {
                                                        opacity: pressed ? 0.6 : 1,
                                                        borderColor: withOpacity(dynamicColor, 0.4)
                                                    }
                                                ]}
                                            >
                                                <Text style={[styles.bottomReleaseText, { color: dynamicColor }]}>RELEASE</Text>
                                            </Pressable>
                                        </Animated.View>

                                        <Pressable
                                            onPress={closeComposer}
                                            style={({ pressed }) => [
                                                styles.bottomCancelBtn,
                                                { opacity: pressed ? 0.6 : 1 }
                                            ]}
                                        >
                                            <Text style={styles.bottomCancelText}>CANCEL</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </Animated.View>
            </Modal>

            {/* V42: Reveal Modal */}
            <RevealModal
                visible={selectedMessage !== null}
                message={selectedMessage}
                color={dynamicColor}
                reportMessage={reportMessage}
                onClose={() => setSelectedMessage(null)}
            />

            {/* Arrival Burst */}
            <View style={styles.burstOverlay}>
                <Animated.View
                    style={[
                        styles.arrivalBurst,
                        {
                            opacity: arrivalFlash,
                            transform: [{ scale: arrivalFlash.interpolate({ inputRange: [0, 1], outputRange: [4, 1] }) }]
                        }
                    ]}
                />
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#010103', overflow: 'hidden' },
    stardust: { position: 'absolute', backgroundColor: '#fff', borderRadius: 1 },
    radialGlow: { position: 'absolute', borderRadius: 300, overflow: 'hidden' },
    lightRay: { position: 'absolute', overflow: 'hidden' },
    arrivalBurst: {
        width: width * 1.5,
        height: height * 0.8,
        backgroundColor: '#fff',
        borderRadius: width,
        filter: Platform.OS === 'web' ? [{ blur: 80 }] as any : undefined,
    },
    burstOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    header: { alignItems: 'center', paddingHorizontal: 30, marginBottom: 30 },
    brandTitle: { color: '#fff', fontSize: 11, fontWeight: '300', letterSpacing: 12, opacity: 0.2, marginBottom: 15 },
    headerState: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)'
    },
    statusDot: { width: 4, height: 4, borderRadius: 2, marginRight: 12 },
    timerLabel: { fontSize: 10, fontWeight: '500', marginRight: 8, letterSpacing: 2 },
    timerSub: { color: 'rgba(255,255,255,0.2)', fontSize: 8, letterSpacing: 1 },

    // V42: Constellation
    constellation: {
        flex: 1,
        position: 'relative',
        marginBottom: 100,
    },
    // V42: Immersive Composer
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabCapsule: {
        width: '70%',
        maxWidth: 240,
        height: 54,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(15,15,20,0.4)',
    },
    fabDisabled: {
        borderColor: 'rgba(255,255,255,0.03)',
        backgroundColor: 'transparent',
    },
    fabText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 10,
        fontWeight: '300',
        letterSpacing: 3,
        textAlign: 'center',
    },
    fabTextDisabled: {
        opacity: 0.2,
        fontSize: 9,
    },
    starContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    starTouchable: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    starAtmosphere: {
        position: 'absolute',
    },
    starCorona: {
        position: 'absolute',
        backgroundColor: 'transparent',
    },
    starHalo: {
        position: 'absolute',
    },
    starCore: {
        position: 'absolute',
    },
    starSpark: {
        position: 'absolute',
    },

    // Reveal Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revealCard: {
        width: '85%',
        maxWidth: 400,
        borderRadius: 32,
        padding: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    revealContent: {
        alignItems: 'center',
    },
    revealText: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 17,
        lineHeight: 26,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
        textAlign: 'center',
        fontWeight: '300',
        letterSpacing: 0.3,
    },
    revealFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 35,
        width: '100%',
    },
    footerLine: {
        flex: 1,
        height: 1,
    },
    revealTime: {
        fontSize: 10,
        marginHorizontal: 15,
        textAlign: 'center',
        letterSpacing: 2,
        fontWeight: '600',
    },
    reportBtn: {
        position: 'absolute',
        top: 25,
        right: 25,
        zIndex: 10,
        padding: 5,
    },
    emptyContainer: { alignItems: 'center', marginTop: height * 0.3 },
    emptyText: { color: 'rgba(255,255,255,0.15)', fontSize: 20, fontWeight: '200', letterSpacing: 1.5 },
    emptySubtext: { color: 'rgba(255,255,255,0.1)', fontSize: 11, marginTop: 10, letterSpacing: 1 },

    // Composer Modal Styles
    composerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    composerKAV: {
        flex: 1,
    },
    composerSheet: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
    },
    composerHeader: {
        position: 'absolute',
        top: 60,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    composerTitle: {
        color: 'rgba(255,255,255,0.05)',
        fontSize: 10,
        fontWeight: '200',
        letterSpacing: 10,
        textAlign: 'center',
    },
    composerContent: {
        width: '100%',
        alignItems: 'center',
    },
    composerInput: {
        color: '#fff',
        fontSize: 30,
        lineHeight: 42,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light',
        textAlign: 'center',
        width: '100%',
        marginBottom: 20,
        fontWeight: '300',
        maxHeight: 250,
        letterSpacing: 0.5,
    },
    composerFooter: {
        alignItems: 'center',
        marginTop: 40,
    },
    charCounter: {
        color: 'rgba(255,255,255,0.05)',
        fontSize: 9,
        letterSpacing: 2,
        marginBottom: 60,
    },
    floatingControls: {
        alignItems: 'center',
        width: '100%',
    },
    bottomReleaseBtn: {
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 35,
        borderRadius: 30,
        marginBottom: 25,
    },
    bottomReleaseText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 5,
    },
    bottomCancelBtn: {
        padding: 10,
    },
    bottomCancelText: {
        color: 'rgba(255,255,255,0.15)',
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 2,
    },
});
