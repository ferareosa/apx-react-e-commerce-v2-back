export class NotificationService {
  async notifyInternalTeam(payload: Record<string, unknown>) {
    console.info('[notification] internal alert', payload);
  }
}
