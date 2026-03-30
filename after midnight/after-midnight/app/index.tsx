import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useNightCycle } from '@/hooks/useNightCycle';
import { ActiveState } from '@/components/ActiveState';
import { ClosedState } from '@/components/ClosedState';

export default function App() {
    const { state, timeRemaining, coolingFactor, toggleTestMode } = useNightCycle();
    const [hasEntered, setHasEntered] = useState(false);

    // Reset entry state if it becomes day
    useEffect(() => {
        if (state === 'CLOSED') {
            setHasEntered(false);
        }
    }, [state]);

    const handleEnterPortal = () => {
        setHasEntered(true);
    };

    const isNight = state === 'ACTIVE';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {isNight && hasEntered ? (
                <ActiveState
                    timeRemaining={timeRemaining}
                    coolingFactor={coolingFactor}
                />
            ) : (
                <ClosedState
                    isPortalOpen={isNight}
                    onEnter={handleEnterPortal}
                    onCheat={toggleTestMode}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#010103',
    },
});
