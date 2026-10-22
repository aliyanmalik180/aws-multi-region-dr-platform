(function () {
  var $ = function (id) { return document.getElementById(id); };
  var set = function (id, t) { $(id).textContent = t; };
  var y = $('year'); if (y) y.textContent = new Date().getFullYear();

  var btn = $('toggle'); if (!btn) return;
  var steps = [].slice.call(document.querySelectorAll('#steps li'));
  var timers = [], failed = false;
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function reveal(n) { steps.forEach(function (li, i) { li.classList.toggle('done', i < n); }); }

  function fail() {
    failed = true; clear(); btn.disabled = true;
    $('east').className = 'region east out';
    set('east-badge', 'Down'); set('east-alb', 'unreachable'); set('east-eks', 'unreachable'); set('east-db', 'unreachable');
    reveal(1);
    later(900, function () { reveal(2); set('dns', 'Route53 health check failed, switching…'); });
    later(1800, function () { reveal(3); set('west-db', 'promoted to writer'); });
    later(2700, function () { reveal(4); set('west-eks', '3 running (scaled up)'); });
    later(3600, function () {
      reveal(5);
      $('west').className = 'region west live';
      set('west-badge', 'Serving traffic'); set('dns', 'Route53 → us-west-2 (DR)');
      btn.disabled = false; btn.dataset.mode = 'restore'; btn.textContent = 'Fail back to primary';
    });
  }
  function restore() {
    failed = false; clear(); btn.disabled = true; reveal(0);
    set('dns', 'Re-syncing data, shifting traffic back…');
    later(1200, function () {
      $('east').className = 'region east live';
      set('east-badge', 'Serving traffic'); set('east-alb', 'healthy'); set('east-eks', '3 running'); set('east-db', 'writer');
      $('west').className = 'region west';
      set('west-badge', 'Standby'); set('west-eks', '1 running (pilot light)'); set('west-db', 'read replica');
      set('dns', 'Route53 → us-east-1 (primary)');
      btn.disabled = false; btn.dataset.mode = 'fail'; btn.textContent = 'Simulate regional outage';
    });
  }
  btn.addEventListener('click', function () { failed ? restore() : fail(); });
})();
