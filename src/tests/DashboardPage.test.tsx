import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { useAuthStore } from '@/store/useAuthStore';

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/signup" element={<div>Signup screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('redirects to signup when there is no session', () => {
    renderDashboard();
    expect(screen.getByText(/signup screen/i)).toBeInTheDocument();
  });

  it('greets the authenticated user', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'member@example.com',
        createdAt: new Date().toISOString(),
      },
      status: 'authenticated',
    });
    renderDashboard();
    expect(
      screen.getByText(/welcome, member@example.com/i),
    ).toBeInTheDocument();
  });

  it('signs out and returns to signup', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'member@example.com',
        createdAt: new Date().toISOString(),
      },
      status: 'authenticated',
    });
    renderDashboard();

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(await screen.findByText(/signup screen/i)).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
