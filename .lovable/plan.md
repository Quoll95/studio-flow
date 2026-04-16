

## Problema Identificato

Le **policy RLS nel database sono corrette** — tutti gli utenti autenticati possono vedere tutti i dati condivisi. Il problema è nel **codice dell'applicazione**: diverse query filtrano i risultati per `user_id`, mostrando solo i dati dell'utente corrente invece di tutti.

## File e Query da Correggere

### 1. `src/components/DashboardAgenda.tsx`
- **Riga 171**: `eventi_calendario` filtrato per `.eq("user_id", user.id)` — rimuovere il filtro per mostrare eventi di tutti
- **Riga 173**: stessa cosa per gli eventi futuri del calendario
- **Riga 177**: `note_giornaliere_postit` filtrato per `.eq("user_id", user.id)` — rimuovere il filtro

### 2. `src/pages/Calendario.tsx`
- **Righe 92-94**: `note_giornaliere_postit` nella query dei giorni con post-it filtrato per `user_id` — rimuovere il filtro
- **Righe 109-111**: stessa tabella nella query dettaglio giorno — rimuovere il filtro

### 3. `src/pages/NettoTasse.tsx`
- **Riga 80**: `netto_tasse_config` filtrato per `.eq("user_id", userId)` — rimuovere il filtro per vedere le config di tutti
- **Riga 81**: `netto_tasse_storico` filtrato per `.eq("user_id", userId)` — rimuovere il filtro
- Le operazioni di **update** (righe 114, 119) mantengono il filtro `user_id` perché solo il proprietario deve poter modificare

### Cosa NON cambia
- **Impostazioni** (`Impostazioni.tsx`): corretto che filtri per il proprio profilo
- **Spese fisse** (`SpeseFisse.tsx`): le query SELECT non filtrano per user_id (usa `.select("*")` senza filtro), quindi è già condiviso. Solo INSERT usa `user_id` (corretto)
- **Guadagni** (`Guadagni.tsx`): nessun filtro user_id nelle query — già condiviso
- Le operazioni di **INSERT/UPDATE/DELETE** continuano a usare `user_id` dell'utente corrente (corretto, perché RLS permette modifica solo ai propri dati)

## Riepilogo Interventi

Rimuovere `.eq("user_id", ...)` dalle query **SELECT** in 3 file (5-6 punti), lasciando invariate le operazioni di scrittura. Nessuna modifica al database necessaria.

