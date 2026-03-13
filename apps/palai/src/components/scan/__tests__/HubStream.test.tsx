/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HubStream } from '../HubStream';

describe('HubStream', () => {
  /**
   * Test img renders with correct src attribute.
   * Validates: Requirement 6.1
   */
  it('renders img with correct src from tunnelUrl', () => {
    const onError = vi.fn();
    render(<HubStream tunnelUrl="https://my-hub.example.com" onError={onError} />);

    const img = screen.getByRole('img', { name: /palai hub live stream/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://my-hub.example.com/stream');
  });

  /**
   * Test img uses object-cover for aspect ratio handling.
   * Validates: Requirement 6.4
   */
  it('applies object-cover class for aspect ratio', () => {
    const onError = vi.fn();
    render(<HubStream tunnelUrl="https://hub.test" onError={onError} />);

    const img = screen.getByRole('img');
    expect(img.className).toContain('object-cover');
  });

  /**
   * Test error message shown on img load failure.
   * Validates: Requirement 6.3
   */
  it('shows error message and retry button on img load failure', () => {
    const onError = vi.fn();
    render(<HubStream tunnelUrl="https://hub.test" onError={onError} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(onError).toHaveBeenCalledWith(
      'Hub stream connection lost. The PalAI Hub may be unreachable.'
    );
    expect(screen.getByText(/unable to connect to palai hub/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument();
  });

  /**
   * Test retry button restores the stream img.
   * Validates: Requirement 6.3
   */
  it('restores stream img when retry button is clicked', () => {
    const onError = vi.fn();
    render(<HubStream tunnelUrl="https://hub.test" onError={onError} />);

    // Trigger error
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /retry connection/i }));

    // Stream img should be back
    const img = screen.getByRole('img', { name: /palai hub live stream/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://hub.test/stream');
  });
});
