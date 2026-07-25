import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuthStore } from '@/store/useAuthStore';
import { authAdapter } from '@/services/auth';

function renderSignup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/dashboard" element={<div>Dashboard screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email$/i), 'new@example.com');
  await user.type(screen.getByLabelText(/^password$/i), 'Str0ngPass');
  await user.type(screen.getByLabelText(/confirm password/i), 'Str0ngPass');
  await user.click(screen.getByLabelText(/i agree/i));
}

describe('SignupForm', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('shows a validation error when submitting empty', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('creates an account and redirects to the dashboard', async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/dashboard screen/i)).toBeInTheDocument();
    expect(useAuthStore.getState().user?.email).toBe('new@example.com');
  });

  it('surfaces a duplicate-email error from the adapter', async () => {
    await authAdapter.signup({
      email: 'dupe@example.com',
      password: 'Str0ngPass',
    });

    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/^email$/i), 'dupe@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Str0ngPass');
    await user.type(screen.getByLabelText(/confirm password/i), 'Str0ngPass');
    await user.click(screen.getByLabelText(/i agree/i));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
