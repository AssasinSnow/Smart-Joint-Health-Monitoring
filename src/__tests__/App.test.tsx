import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Smart Joint Monitor PWA Shell', () => {
  it('renders application header and title successfully', async () => {
    render(<App />);
    const headers = await screen.findAllByText(/Smart Joint Monitor/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders Joint Health Index hero gauge', async () => {
    render(<App />);
    expect(await screen.findByText(/Joint Health Index \(JHI\)/i)).toBeInTheDocument();
  });

  it('renders responsive mobile bottom navigation', async () => {
    render(<App />);
    expect(await screen.findByLabelText(/Mobile Navigation/i)).toBeInTheDocument();
  });
});
