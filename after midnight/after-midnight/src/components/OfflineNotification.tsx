import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const OfflineNotification = () => {
    const [isOffline, setIsOffline] = useState(false);
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            // Only consider it offline if isConnected is EXPLICITLY false.
            // Ignore 'null' states which happen during initialization.
            const offline = state.isConnected === false;
            setIsOffline(offline);

            // Animate in/out
            Animated.timing(slideAnim, {
                toValue: offline ? 0 : -100,
                duration: 400,
                useNativeDriver: false, // Fallback to JS to avoid native module missing warnings
            }).start();
        });

        return () => unsubscribe();
    }, []);

    if (!isOffline) return null;

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
        ]}>
            <View style={styles.content}>
                <Text style={styles.text}>No connection</Text>
                <Text style={styles.subtext}>Come back when you have internet</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        ...Platform.select({
            ios: {
                paddingTop: 50,
            },
            android: {
                paddingTop: 40,
            },
            default: {
                paddingTop: 20,
            }
        })
    },
    content: {
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 100, 100, 0.2)',
    },
    text: {
        color: '#ff6b6b',
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtext: {
        color: 'rgba(255, 107, 107, 0.6)',
        fontSize: 9,
        marginTop: 2,
        letterSpacing: 1,
    }
});
