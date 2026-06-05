---
layout: null
---
{% assign sorted_posts = site.posts | sort: "date" | reverse %}window.ES_POSTS = [
{% for post in sorted_posts %}{"id":"{{ post.date | date: '%Y-%m-%d' }}-{{ post.title | slugify }}","slug":"{{ post.title | slugify }}","iso":"{{ post.date | date: '%Y-%m-%d' }}","date":"{{ post.date | date: '%b %-d, %Y' }}","dateLong":"{{ post.date | date: '%B %-d, %Y' }}","monthYear":"{{ post.date | date: '%B %Y' }}","title":{{ post.title | jsonify }},"dek":{{ post.description | default: "" | jsonify }},"tags":{% if post.tags %}{{ post.tags | jsonify }}{% else %}[]{% endif %},"body":{{ post.content | jsonify }},"read":"{{ post.content | number_of_words | divided_by: 200 | plus: 1 }} min","words":{{ post.content | number_of_words }},"eyebrow":"Field notes"}{% unless forloop.last %},{% endunless %}
{% endfor %}];
(function(){var tc={};ES_POSTS.forEach(function(p){(p.tags||[]).forEach(function(t){tc[t]=(tc[t]||0)+1;});});window.ES_TAGS=Object.keys(tc).map(function(t){return{tag:t,count:tc[t]};}).sort(function(a,b){return b.count-a.count;});})();
