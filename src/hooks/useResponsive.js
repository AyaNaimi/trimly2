// src/hooks/useResponsive.js
// Hook React pour le système responsive

import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { getAdaptiveDimensions, getDeviceType } from '../utils/responsive';

/**
 * Hook pour obtenir les dimensions adaptatives et réagir aux changements
 * @returns {Object} Dimensions adaptatives et informations sur l'appareil
 */
export function useResponsive() {
  const [dimensions, setDimensions] = useState(getAdaptiveDimensions());
  const [deviceType, setDeviceType] = useState(getDeviceType());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getAdaptiveDimensions());
      setDeviceType(getDeviceType());
    });

    return () => subscription?.remove();
  }, []);

  return {
    ...dimensions,
    deviceType,
  };
}

/**
 * Hook pour obtenir les dimensions de l'écran
 * @returns {Object} Largeur et hauteur de l'écran
 */
export function useScreenDimensions() {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
}

/**
 * Hook pour vérifier si l'écran est en mode paysage
 * @returns {boolean} True si en mode paysage
 */
export function useIsLandscape() {
  const { width, height } = useScreenDimensions();
  return width > height;
}

/**
 * Hook pour obtenir l'orientation de l'écran
 * @returns {string} 'portrait' ou 'landscape'
 */
export function useOrientation() {
  const isLandscape = useIsLandscape();
  return isLandscape ? 'landscape' : 'portrait';
}

export default useResponsive;
