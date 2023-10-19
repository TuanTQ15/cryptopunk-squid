import { BIGINT_ZERO } from "../constant";
import { epnsNotificationCounters, epnsPushNotifications } from "../main";
import { EpnsNotificationCounter, EpnsPushNotification } from "../model";

export function getOrCreateEpnsNotificationCounter(
  subgraphID_ONE: string
): EpnsNotificationCounter {
  let epnsNotificationCounter = epnsNotificationCounters.get(subgraphID_ONE);
  if (!epnsNotificationCounter) {
    epnsNotificationCounter = new EpnsNotificationCounter({
      id: subgraphID_ONE,
    });
    epnsNotificationCounter.totalCount = BIGINT_ZERO;
  }
  return epnsNotificationCounter;
}

export function getOrCreateEpnsNotification(
  subgraphID_TWO: string
): EpnsPushNotification {
  let epnsPushNotification = epnsPushNotifications.get(subgraphID_TWO);
  if (!epnsPushNotification) {
    epnsPushNotification = new EpnsPushNotification({
      id: subgraphID_TWO,
    });
  }
  return epnsPushNotification;
}
