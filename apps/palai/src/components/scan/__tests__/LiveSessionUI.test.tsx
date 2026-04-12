/// <reference types="vitest/globals" />
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createRef } from 'react';
import { LiveSessionUI, type LiveSessionUIProps } from '../LiveSessionUI';

afterEach(() => {
  cleanup();
});

function renderUI(overrides: Partial<LiveSessionUIProps> = {}) {
  const defaults: LiveSessionUIProps = {
    status: 'idle',
    timeRemaining: 120,
    transcription: '',
    isSpeaking: false,
    isWarning: false,
    error: null,
    onStart: vi.fn(),
    onEnd: vi.fn(),
    onFallback: vi.fn(),
    onToggleCamera: vi.fn(),
    hasMultipleCameras: false,
    videoRef: createRef<HTMLVideoElement>(),
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<LiveSessionUI {...props} />), props };
}

describe('LiveSessionUI', () => {
  it('renders "Start Live Session" label when idle', () => {
    renderUI({ status: 'idle' });
    expect(screen.getByText('Start Live Session')).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    const onStart = vi.fn();
    renderUI({ status: 'idle', onStart });
    // The center button is the large circular one — click the Play icon's parent button
    const startLabel = screen.getByText('Start Live Session');
    // Find the button above the label (the circular button in the flex row)
    const buttons = document.querySelectorAll('button');
    // The start button is the one with the green inner circle
    const startButton = Array.from(buttons).find((b) => b.querySelector('.bg-green-600') !== null);
    expect(startButton).toBeTruthy();
    fireEvent.click(startButton!);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('shows connecting state with spinner', () => {
    renderUI({ status: 'connecting' });
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
    expect(screen.queryByText('Start Live Session')).not.toBeInTheDocument();
  });

  it('renders "End Session" label when active', () => {
    renderUI({ status: 'active' });
    expect(screen.getByText('End Session')).toBeInTheDocument();
    expect(screen.queryByText('Start Live Session')).not.toBeInTheDocument();
  });

  it('calls onEnd when end button is clicked', () => {
    const onEnd = vi.fn();
    renderUI({ status: 'active', onEnd });
    const buttons = document.querySelectorAll('button');
    const endButton = Array.from(buttons).find((b) => b.querySelector('.bg-red-600') !== null);
    expect(endButton).toBeTruthy();
    fireEvent.click(endButton!);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('displays session timer countdown when active', () => {
    renderUI({ status: 'active', timeRemaining: 90 });
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('formats timer correctly for various values', () => {
    render(
      <LiveSessionUI
        status="active"
        timeRemaining={5}
        transcription=""
        isSpeaking={false}
        isWarning={false}
        error={null}
        onStart={vi.fn()}
        onEnd={vi.fn()}
        onFallback={vi.fn()}
        videoRef={createRef<HTMLVideoElement>()}
      />
    );
    expect(screen.getByText('0:05')).toBeInTheDocument();
  });

  it('displays transcription overlay when active with text', () => {
    renderUI({ status: 'active', transcription: 'I can see brown spots on the leaf.' });
    expect(screen.getByText('I can see brown spots on the leaf.')).toBeInTheDocument();
  });

  it('does not display transcription overlay when text is empty', () => {
    const { container } = renderUI({ status: 'active', transcription: '' });
    expect(container.querySelector('.bg-black\\/60')).not.toBeInTheDocument();
  });

  it('shows audio indicator as "AI Speaking" when isSpeaking is true', () => {
    renderUI({ status: 'active', isSpeaking: true });
    expect(screen.getByText('AI Speaking')).toBeInTheDocument();
  });

  it('shows audio indicator as "Listening" when isSpeaking is false', () => {
    renderUI({ status: 'active', isSpeaking: false });
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('shows 30-second warning banner when isWarning is true and active', () => {
    renderUI({ status: 'active', isWarning: true, timeRemaining: 25 });
    expect(screen.getByText(/Session ending soon/)).toBeInTheDocument();
  });

  it('does not show warning banner when isWarning is false', () => {
    renderUI({ status: 'active', isWarning: false, timeRemaining: 60 });
    expect(screen.queryByText(/Session ending soon/)).not.toBeInTheDocument();
  });

  it('renders error state with retry and fallback buttons', () => {
    renderUI({ status: 'error', error: 'Connection failed' });
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Photo Capture')).toBeInTheDocument();
  });

  it('calls onStart when retry is clicked in error state', () => {
    const onStart = vi.fn();
    renderUI({ status: 'error', error: 'Oops', onStart });
    fireEvent.click(screen.getByText('Retry'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onFallback when photo capture is clicked in error state', () => {
    const onFallback = vi.fn();
    renderUI({ status: 'error', error: 'Oops', onFallback });
    fireEvent.click(screen.getByText('Photo Capture'));
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it('shows extracting state with spinner', () => {
    renderUI({ status: 'extracting' });
    expect(screen.getByText('Generating diagnosis…')).toBeInTheDocument();
  });

  it('renders a video element with correct attributes', () => {
    renderUI({ status: 'active' });
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('playsinline', '');
  });

  it('shows switch camera button when hasMultipleCameras is true and idle', () => {
    const onToggleCamera = vi.fn();
    renderUI({ status: 'idle', hasMultipleCameras: true, onToggleCamera });
    // The switch camera button has RotateCw icon inside a 12x12 circle
    const buttons = document.querySelectorAll('button.w-12');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(onToggleCamera).toHaveBeenCalledOnce();
  });

  it('does not show switch camera button when hasMultipleCameras is false', () => {
    renderUI({ status: 'idle', hasMultipleCameras: false });
    // Should have spacer divs instead of camera toggle button
    const buttons = document.querySelectorAll('button.w-12');
    expect(buttons.length).toBe(0);
  });
});
