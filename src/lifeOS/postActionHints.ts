export type LifeOSTrackedAction =
  | 'legal'
  | 'callHelp'
  | 'interpreter'
  | 'callAssist'
  | 'findServices'
  | 'topUp'
  | 'learning';

export function postActionHintsFor(
  action: LifeOSTrackedAction,
  ctx: { legalCredits: number; leonaCredits: number; interpreterCredits: number; leTanCredits: number }
): string[] {
  switch (action) {
    case 'interpreter':
      return [
        `Gọi Leona (${ctx.leonaCredits}+ Credits/cuộc) để chốt việc sau khi đã giao tiếp xong.`,
        `Mở Lễ tân (${ctx.leTanCredits} Credits/lượt mô phỏng) nếu cần đặt lịch / chốt đơn.`,
      ];
    case 'callHelp':
    case 'legal':
      return [
        'Cập nhật ngày mới trong Vault để LifeOS nhắc đúng kỳ sau.',
        `Cần nói trực tiếp với CSKH? Dùng phiên dịch (${ctx.interpreterCredits} Credits/phiên).`,
      ];
    case 'callAssist':
      return [
        `Chốt xong? Nhờ Leona gọi xác nhận (${ctx.leonaCredits}+ Credits) hoặc mở Radar tìm dịch vụ gần bạn.`,
      ];
    case 'findServices':
      return [
        `Gọi / đặt qua Leona (${ctx.leonaCredits}+ Credits) hoặc vào Lễ tân (${ctx.leTanCredits} Credits/lượt) để chốt nhanh.`,
      ];
    case 'topUp':
      return [
        `Thử lại hành động bạn vừa định làm — ưu tiên gia hạn (${ctx.legalCredits} Credits) hoặc phiên dịch (${ctx.interpreterCredits} Credits).`,
      ];
    case 'learning':
      return [
        `Ôn xong — dùng phiên dịch (${ctx.interpreterCredits} Credits) thực hành ngoài đời hoặc Leona (${ctx.leonaCredits}+ Credits) khi cần gọi.`,
      ];
    default:
      return [];
  }
}
