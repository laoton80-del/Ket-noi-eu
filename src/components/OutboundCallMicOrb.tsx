import { type ReactNode } from 'react';
import { DongSonSkeuomorphicButton } from './DongSonSkeuomorphicButton';

type OutboundCallMicOrbProps = {
  onPress?: () => void;
  disabled?: boolean;
  children?: ReactNode;
};

/**
 * Nút mic gọi đối ngoại (Leona) — wrapper trung tính; giữ chrome ornate hiện tại qua implementation nội bộ.
 * Giảm phụ thuộc tên `DongSon` ở màn hình gọi.
 */
export function OutboundCallMicOrb({ onPress, disabled, children }: OutboundCallMicOrbProps) {
  return (
    <DongSonSkeuomorphicButton variant="avatar-ring" size="md" onPress={onPress} disabled={disabled}>
      {children}
    </DongSonSkeuomorphicButton>
  );
}
