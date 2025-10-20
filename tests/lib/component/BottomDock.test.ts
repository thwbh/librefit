import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import BottomDock from '../../../src/lib/component/BottomDock.svelte';

// Mock the navigation module
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock the Settings component
vi.mock('../../../src/lib/component/settings/Settings.svelte', () => ({
  default: vi.fn()
}));

describe('BottomDock Component', () => {
  it('should not render when activeRoute is undefined', () => {
    render(BottomDock, { props: {} });

    const dock = screen.queryByTestId('dock');
    expect(dock).toBeNull();
  });

  it('should render navigation buttons when activeRoute is provided', () => {
    render(BottomDock, { props: { activeRoute: '/' } });

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Progress')).toBeDefined();
    expect(screen.getByText('History')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('should highlight active route button', () => {
    render(BottomDock, { props: { activeRoute: '/progress' } });

    const progressButton = screen.getByText('Progress').closest('button');
    expect(progressButton).toHaveClass('dock-active');

    const homeButton = screen.getByText('Home').closest('button');
    expect(homeButton).not.toHaveClass('dock-active');
  });

  it('should call goto when home button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    const user = userEvent.setup();

    render(BottomDock, { props: { activeRoute: '/' } });

    const homeButton = screen.getByText('Home').closest('button');
    await user.click(homeButton!);

    expect(goto).toHaveBeenCalledWith('/');
  });

  it('should call navigate function when progress button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    const user = userEvent.setup();

    render(BottomDock, { props: { activeRoute: '/' } });

    const progressButton = screen.getByText('Progress').closest('button');
    await user.click(progressButton!);

    expect(goto).toHaveBeenCalledWith('/progress');
  });

  it('should call navigate function when history button is clicked', async () => {
    const { goto } = await import('$app/navigation');
    const user = userEvent.setup();

    render(BottomDock, { props: { activeRoute: '/' } });

    const historyButton = screen.getByText('History').closest('button');
    await user.click(historyButton!);

    expect(goto).toHaveBeenCalledWith('/history');
  });

  it('should render settings dropdown', () => {
    render(BottomDock, { props: { activeRoute: '/' } });

    const settingsText = screen.getByText('Settings');
    expect(settingsText).toBeDefined();

    // Look for the parent dropdown div
    const settingsDropdown = settingsText.closest('.dropdown');
    expect(settingsDropdown).toBeDefined();
    expect(settingsDropdown).toHaveClass('dropdown-top');
  });
});
