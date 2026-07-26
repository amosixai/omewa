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

  it('sends a logged-out visitor from the feed to the login page', async () => {
    renderApp('/');
    // Bootstrap resolves to no session, so the protected feed redirects to login.
    expect(await screen.findByText(/welcome back/i)).toBeInTheDocument();
  });

  it('renders a 404 for an unknown route', () => {
    renderApp('/does-not-exist');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
