import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModePicker } from '../components/ModePicker';
import { GameMode, TimedDuration } from '@anaroo/shared';

describe('ModePicker', () => {
  const defaultProps = {
    selectedMode: GameMode.TIMED,
    selectedDuration: TimedDuration.SIXTY,
    onModeChange: vi.fn(),
    onDurationChange: vi.fn(),
  };

  it('renders all three mode buttons', () => {
    render(<ModePicker {...defaultProps} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Timed')).toBeInTheDocument();
    expect(screen.getByText('Survival')).toBeInTheDocument();
  });

  it('highlights the selected mode', () => {
    render(<ModePicker {...defaultProps} selectedMode={GameMode.DAILY} />);
    const dailyButton = screen.getByText('Daily').closest('button');
    expect(dailyButton?.className).toContain('active');
  });

  it('calls onModeChange when a mode button is clicked', async () => {
    const onModeChange = vi.fn();
    render(<ModePicker {...defaultProps} onModeChange={onModeChange} />);

    await userEvent.click(screen.getByText('Daily'));
    expect(onModeChange).toHaveBeenCalledWith(GameMode.DAILY);
  });

  it('shows duration selector only for Timed mode', () => {
    const { rerender } = render(<ModePicker {...defaultProps} selectedMode={GameMode.TIMED} />);
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    expect(screen.getByText('120s')).toBeInTheDocument();

    rerender(<ModePicker {...defaultProps} selectedMode={GameMode.DAILY} />);
    expect(screen.queryByText('30s')).not.toBeInTheDocument();
  });

  it('calls onDurationChange when duration button clicked', async () => {
    const onDurationChange = vi.fn();
    render(<ModePicker {...defaultProps} onDurationChange={onDurationChange} />);

    await userEvent.click(screen.getByText('30s'));
    expect(onDurationChange).toHaveBeenCalledWith(TimedDuration.THIRTY);
  });

  it('highlights the selected duration', () => {
    render(<ModePicker {...defaultProps} selectedDuration={TimedDuration.ONE_TWENTY} />);
    const btn = screen.getByText('120s');
    expect(btn.className).toContain('active');
  });

  it('shows mode description', () => {
    render(<ModePicker {...defaultProps} selectedMode={GameMode.TIMED} />);
    expect(screen.getByText(/solve as many words/i)).toBeInTheDocument();
  });
});
