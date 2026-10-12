---
title: "tarjan学习笔记：割点，割边，强连通，缩点，LCA，2-SAT"
date: 2021-06-27 21:42:00
tags:
  - "笔记"
---

#### 1.割点

题目：给定n个点，m条边的无向图，求图的割点。

割点：在一张无向图中删去这个点以及相连的边，原图的连通分量增加。

简单来说，删去这个点后，原图被分成了两半。

考虑对原图进行dfs，依据dfs顺序得到一棵树。

![](https://cdn.luogu.com.cn/upload/image_hosting/2hj6a452.png?x-oss-process=image/resize,m_lfit,h_170,w_225)

如上图左，3和4是割点，原图的dfs树如右图。

tarjan算法主要利用两个数组：dfn和low。其中dfn数组为时间戳，即该点是第几个被搜索到的。low数组代表该点能回溯到的树中最上面的点的dfn（不经过与父节点相连的边）。

![](https://cdn.luogu.com.cn/upload/image_hosting/75ahhrwj.png?x-oss-process=image/resize,m_lfit,h_170,w_225)

如上图右。其中所有黑色的边都为遍历时要用的边，而3<->1这条红色的边则是遍历时没有用过，可以用来回溯的边。故low[3] = 1。同时节点2和4也可以通过3回溯到1，low[2] = low[4] = 1。

那么计算dfn显然每一层+1即可，计算low时，一是如果该节点x有边连向上面的点y，则取low[x]=min(low[x],dfn[y])。二是在子节点中更新最小的即可。

考虑对于一个点x，若有子节点中一点y存在low[y]<dfn[x]，意味着点y有路径返回上面的点，即去掉点x不影响图的联通。反之，若有任意一点low[y] >= dfn[x]，x即为割点。

根节点特判：有两个或两个以上孩子即为割点。

代码如下：
```cpp
#include <bits/stdc++.h>
#define N 200005
using namespace std;
int n, m, head[N], cnt, top, ans;
int dfn[N], low[N], cut[N], vis[N];
struct Edge{
	int v, nxt;
}e[N];
void add(int u, int v){
	e[++cnt].v = v;
	e[cnt].nxt = head[u];
	head[u] = cnt;
}
void dfs(int u, int fa){
	dfn[u] = low[u] = ++cnt;
	int ch = 0;
	for(int i = head[u]; i; i = e[i].nxt){
		int to = e[i].v;
		if(to == fa) continue;
		++ch;
		if(!low[to]){
			dfs(to, u);
			low[u] = min(low[u], low[to]);
			if((fa == -1 && ch >= 2) || (fa != -1 && low[to] >= dfn[u])) cut[u] = 1;
		}
		low[u] = min(low[u], dfn[to]);
	}
}
int main(){
	scanf("%d%d", &n, &m);
	for(int i = 1; i <= m; ++i){
		int u, v;
		scanf("%d%d", &u, &v);
		add(u, v); add(v, u);
	}
	for(int i = 1; i <= n; ++i) if(!low[i]) dfs(i, -1);
	for(int i = 1; i <= n; ++i) if(cut[i]) ans++;
	printf("%d\n", ans);
	for(int i = 1; i <= n; ++i) if(cut[i]) printf("%d ", i);
	return 0;
}
```
#### 2.割边

定义同割点。

解法同理，显然若有low[y]>dfn[x] ,则(x,y)是一条割边。

在y这个点，不经过边(x,y)的前提下，没有办法走到x或者更上面的点，一旦删掉边(x,y)，整个图将会分成两部分，因此(x,y)是割边。

#### 3.缩点

题目：给定一个n个点m条边有向图，每个点有一个权值，求一条路径，使路径经过的点权值之和最大。

因为有环，所以直接跑搜索肯定不太行。既然重复走也无所谓，那么考虑把一个环看成一个点，毕竟如果走到这个环上的某个点肯定要把这个环走完。

![](https://cdn.luogu.com.cn/upload/image_hosting/jqzov1k4.png?x-oss-process=image/resize,m_lfit,h_170,w_225)

在本张图中，4->3的边并不能形成环，但是7->5就可以。

考虑一点x若有dfn[x]=low[x]，意味着在x的子树中还有一点连向x（比如7->5），形成一个环。遇到这样的点，我们可以将这个环上的所有点权集中到点x上，用x替代整个环。

使用栈维护，每次将点压入。遇到一个点x符合上述条件的，可以将这个栈里的点从当前点y一直弹到x，点权累加至x，并且标记所有点属于x（belong[y]=x)

再次建图。现在成为了一个DAG，使用拓扑排序或者直接搜索+DP即可。

```
#include <bits/stdc++.h>
#define N 100005
using namespace std;
int n, m, w[N];
struct Edge{
	int u, v, nxt;
}e[N];
struct Edge2{
	int v, nxt;
}ed[N];
int head[N], h[N], cnt;
int dfn[N], low[N], sta[N], vis[N], g[N], ind[N], top, ct;
int f[N], tot, ans;
void add(int u, int v){
	e[++cnt].v = v;
	e[cnt].u = u;
	e[cnt].nxt = head[u];
	head[u] = cnt;
}
void add2(int u, int v){
	ed[++cnt].v = v;
	ed[cnt].nxt = h[u];
	h[u] = cnt;
}
void tarjan(int u){
	low[u] = dfn[u] = ++ct;
	sta[++top] = u; vis[u] = 1;
	for(int i = head[u]; i; i = e[i].nxt){
		int to = e[i].v;
		if(!dfn[to]){
			tarjan(to);
			low[u] = min(low[u], low[to]);
		}
		else if(vis[to]) low[u] = min(low[u], low[to]);
	}
	if(dfn[u] == low[u]){
		int x;
		while(x = sta[top--]){
			g[x] = u;
			vis[x] = 0;
			if(x == u) break;
			w[u] += w[x];
		}
	}
}
int tp(){
	queue<int> q;
	for(int i = 1; i <= n; ++i){
		if(g[i] == i && !ind[i]){
			q.push(i);
			f[i] = w[i];
		}
	}
	while(q.size()){
		int now = q.front(); q.pop();
		for(int i = h[now]; i; i = ed[i].nxt){
			int to = ed[i].v;
			f[to] = max(f[to], f[now] + w[to]);
			ind[to]--;
			if(!ind[to]) q.push(to);
		}
	}
	for(int i = 1; i <= m; ++i) ans = max(ans, f[i]);
	return ans;
}
int main(){
	scanf("%d%d", &n, &m);
	for(int i = 1; i <= n; ++i) scanf("%d", &w[i]);
	for(int i = 1; i <= m; ++i){
		int u, v;
		scanf("%d%d", &u, &v);
		add(u, v);
	}
	cnt = 0;
	for(int i = 1; i <= n; ++i) if(!dfn[i]) tarjan(i);
	for(int i = 1; i <= m; ++i){
		int x = g[e[i].u], y = g[e[i].v];
		if(x != y){
			add2(x, y);
			ind[y]++;
		}
	}
	printf("%d", tp());
	return 0;
}
```
#### 4.2-SAT

模板题P4782。

比如1为真或3为真。那么1为假时3必定为真，3为假时1必定为真。考虑建图，由1的假向3的真建边，3的真向1的假建边。可以用1-n表示真，n-n*2表示假。

对图进行缩点，若一个点的真和假处于一个强连通分量内则必定无解（既要真又要假）。输出可行方案只要都输出强连通分量较小（较大亦然）即可。

```
#include <bits/stdc++.h>
#define N 2000005
using namespace std;
int n, m, cnt, tot, top, head[N], scs;
int dfn[N], low[N], vis[N], sta[N], scc[N];	
struct Edge{
	int v, nxt;
}e[N];
void add(int u, int v){
	e[++cnt].v = v;
	e[cnt].nxt = head[u];
	head[u] = cnt;
}
void tarjan(int x){
	low[x] = dfn[x] = ++tot;
	vis[x] = 1; sta[++top] = x;
	for(int i = head[x]; i; i = e[i].nxt){
		int to = e[i].v;
		if(!dfn[to]){
			tarjan(to);
			low[x] = min(low[x], low[to]);
		}
		else if(vis[to]) low[x] = min(low[x], dfn[to]);
	}
	if(low[x] == dfn[x]){
		int y;
		++scs;
		while(1){
			y = sta[top--];
			scc[y] = scs;
			vis[y] = 0;
			if(x == y) break;
		}
	}
}
int main(){
	scanf("%d%d", &n, &m);
	for(int i = 1; i <= m; ++i){
		int u, v, fu, fv;
		scanf("%d%d%d%d", &u, &fu, &v, &fv);
		if(!fu && !fv){
			add(u, v + n);
			add(v, u + n);
		}
		if(fu && !fv){
			add(u + n, v + n);
			add(v, u);
		}
		if(!fu && fv){
			add(u, v);
			add(v + n, u + n);
		}
		if(fu && fv){
			add(u + n, v);
			add(v + n, u);
		}
	}
	for(int i = 1; i <= n * 2; ++i) if(!dfn[i]) tarjan(i);
	for(int i = 1; i <= n; ++i){
		if(scc[i] == scc[i + n]){
			printf("IMPOSSIBLE");
			return 0;
		}
	}
	printf("POSSIBLE\n");
	for(int i = 1; i <= n; ++i){
		if(scc[i] > scc[i + n]) printf("0 ");
		else printf("1 ");
	}
	return 0;
}
```
5.LCA

咕
