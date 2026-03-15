import { test, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import TelemetryTab from '/app/src/lib/components/tabs/TelemetryTab.svelte';
import { telemetryState } from '/app/src/lib/telemetryStore';

test('Telemetry empty state and accessibility features render correctly', () => {
  // Set the store state to disconnected
  telemetryState.set({
    status: 'disconnected',
    fps: 0,
    packet: null
  });

  const { container, getByText, queryByText } = render(TelemetryTab);

  // Verify Empty State is visible
  const emptyTitle = getByText("No telemetry data");
  expect(emptyTitle).toBeTruthy();

  const emptyDesc = getByText("Connect to your robot to view real-time variable updates.");
  expect(emptyDesc).toBeTruthy();

  // Verify visually hidden labels exist
  const ipLabel = container.querySelector('.sr-only');
  expect(ipLabel).toBeTruthy();
});
