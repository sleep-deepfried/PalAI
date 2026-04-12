/// <reference types="vitest/globals" />
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModeSelector } from '../ModeSelector';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('ModeSelector', () => {
  it('renders both mode options', () => {
    render(<ModeSelector mode="photo" onModeChange={() => {}} liveSupported={true} />);
    expect(screen.getByText('Photo Capture')).toBeInTheDocument();
    expect(screen.getByText('Live Diagnosis')).toBeInTheDocument();
  });

  it('highlights the active mode', () => {
    const { rerender } = render(
      <ModeSelector mode="photo" onModeChange={() => {}} liveSupported={true} />
    );
    const photoBtn = screen.getByText('Photo Capture').closest('button')!;
    const liveBtn = screen.getByText('Live Diagnosis').closest('button')!;

    expect(photoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(liveBtn).toHaveAttribute('aria-pressed', 'false');

    rerender(<ModeSelector mode="live" onModeChange={() => {}} liveSupported={true} />);
    expect(photoBtn).toHaveAttribute('aria-pressed', 'false');
    expect(liveBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onModeChange when a mode button is clicked', () => {
    const onModeChange = vi.fn();
    render(<ModeSelector mode="photo" onModeChange={onModeChange} liveSupported={true} />);

    fireEvent.click(screen.getByText('Live Diagnosis'));
    expect(onModeChange).toHaveBeenCalledWith('live');

    fireEvent.click(screen.getByText('Photo Capture'));
    expect(onModeChange).toHaveBeenCalledWith('photo');
  });

  it('disables Live Diagnosis button when liveSupported is false', () => {
    const onModeChange = vi.fn();
    render(<ModeSelector mode="photo" onModeChange={onModeChange} liveSupported={false} />);

    const liveBtn = screen.getByText('Live Diagnosis').closest('button')!;
    expect(liveBtn).toBeDisabled();

    fireEvent.click(liveBtn);
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('persists mode to localStorage', () => {
    const { rerender } = render(
      <ModeSelector mode="photo" onModeChange={() => {}} liveSupported={true} />
    );
    expect(localStorage.getItem('palai-scan-mode')).toBe('photo');

    rerender(<ModeSelector mode="live" onModeChange={() => {}} liveSupported={true} />);
    expect(localStorage.getItem('palai-scan-mode')).toBe('live');
  });

  it('shows tooltip when live is not supported', () => {
    render(<ModeSelector mode="photo" onModeChange={() => {}} liveSupported={false} />);
    const liveBtn = screen.getByText('Live Diagnosis').closest('button')!;
    expect(liveBtn).toHaveAttribute('title', 'Live Diagnosis is not supported on this device');
  });
});
