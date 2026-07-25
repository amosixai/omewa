import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '@/App';
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/store/useAuthStore';

function renderApp(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('redirects the index route to the signup page', () => {
    renderApp('/');
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  it('renders a 404 for an unknown route', () => {
    renderApp('/does-not-exist');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
