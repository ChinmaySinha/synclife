import React from 'react';

/**
 * Hardware-accelerated CSS @property skeleton loader.
 * Employs a shimmer animation offloaded to the compositor layer.
 */
export default function SkeletonLoader({
  className = '',
  style = {},
  height = '100%',
  width = '100%'
}: {
  className?: string;
  style?: React.CSSProperties;
  height?: string | number;
  width?: string | number;
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        ...style,
        height,
        width,
      }}
    />
  );
}
