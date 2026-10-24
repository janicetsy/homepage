// 年份
const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

// 导航阴影
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 移动端菜单
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  toggle.classList.toggle('open');
  links.classList.toggle('open');
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.classList.remove('open');
  links.classList.remove('open');
}));

// 平台筛选
const chips = document.querySelectorAll('#jobFilters .chip');
const jobs = document.querySelectorAll('.job');
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const f = chip.dataset.filter;
  jobs.forEach(j => j.classList.toggle('hide', f !== 'all' && j.dataset.cat !== f && j.dataset.cat !== 'all'));
}));

// 滚动渐显
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 })
  : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));
