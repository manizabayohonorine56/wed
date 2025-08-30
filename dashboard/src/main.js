import './styles.css'

const app = document.getElementById('app')

app.innerHTML = `
  <header class="dash-header">
    <div class="container">
      <h1 class="brand">Ash & Sam — Dashboard</h1>
      <nav class="nav">
        <a href="/admin.html">Back to site</a>
      </nav>
    </div>
  </header>
  <main class="container">
    <section class="hero">
      <h2>Welcome, Admin</h2>
      <p>Overview of the wedding site and guests.</p>
    </section>

    <section class="stats grid">
      <div class="card">
        <h3>RSVPs</h3>
        <p class="big">128</p>
      </div>
      <div class="card">
        <h3>Attending</h3>
        <p class="big">102</p>
      </div>
      <div class="card">
        <h3>Guests</h3>
        <p class="big">76</p>
      </div>
    </section>

    <section class="attendees">
      <h3>Recent attendees</h3>
      <ul class="list">
        <li>Jane Doe — Attending</li>
        <li>John Smith — Regrets</li>
        <li>Alex Roe — Attending</li>
      </ul>
    </section>

    <section class="settings">
      <h3>Settings</h3>
      <p>Manage site settings and guests.</p>
    </section>
  </main>
  <footer class="container foot">© 2025 Ash & Sam</footer>
`
