/**
 * Sales rep metrics derived from lead logs (each log = one customer conversation / "call").
 *
 * Conversion (30d): % of that rep's leads in the last 30 days where AI interest is
 * "Interested" or "Highly Interested" (excludes "Not Interested").
 */

function parseTime(iso) {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isPositiveInterest(level) {
  return level === 'Interested' || level === 'Highly Interested';
}

export function buildSalesRepPerformance(leads, agents) {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startTodayMs = startOfToday.getTime();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return agents.map((agent) => {
    const id = agent.id;
    const name = agent.displayName || agent.name || 'Agent';
    const mine = leads.filter((l) => l.agentId === id);

    const callsToday = mine.filter((l) => parseTime(l.timestamp) >= startTodayMs).length;
    const callsWeek = mine.filter((l) => parseTime(l.timestamp) >= weekAgo).length;
    const callsMonth = mine.filter((l) => parseTime(l.timestamp) >= monthAgo).length;

    const monthLeads = mine.filter((l) => parseTime(l.timestamp) >= monthAgo);
    const totalM = monthLeads.length;
    const positiveM = monthLeads.filter((l) => isPositiveInterest(l.interestLevel)).length;
    const conversionRate = totalM > 0 ? Math.round((positiveM / totalM) * 100) : null;

    return {
      agentId: id,
      name,
      email: agent.email || '',
      callsToday,
      callsWeek,
      callsMonth,
      conversionRate,
      leadsInMonth: totalM,
      positiveInMonth: positiveM,
    };
  });
}
