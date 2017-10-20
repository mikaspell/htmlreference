// Created by MikaSpell on 16.01.17.

console.info('Пиши код красиво!', 'work@melkee.ru', '2017');

document.addEventListener('click', function (e) {
  var target = e.target;

  if(target.tagName !== 'TD') return;
  location.href = target.parentNode.getAttribute('data-url');
});

document.addEventListener('change', function (e) {
  var target = e.target;

  if(target.name !== 'types') return;

  var rows = document.querySelectorAll('.all-tag-table tr'),
    type;

  rows.forEach(function (row) {
    type = row.getAttribute('data-category');
    if(type === target.value && !target.checked) {
      row.style.display = 'none'
    } else if (type === target.value && target.checked) {
      row.style.display = '';
    }
  });
});