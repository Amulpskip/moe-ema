-- ============================================================
--  おみくじボーナス・ポイント（大吉100 / 凶200）  1回だけ実行
--  Supabase → SQL Editor に貼って Run
--  ※これを実行するまで、おみくじのポイント受取は「準備中」表示になります。
-- ============================================================

-- 来訪者がおみくじで獲得したポイントの記録
create table if not exists public.omikuji_points (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  pts        int  not null,
  kind       text,                       -- 'daikichi'（大吉）| 'kyo'（凶）
  created_at timestamptz default now()
);

alter table public.omikuji_points enable row level security;

-- 閲覧：全員OK（VIPポイントの集計に使う）
create policy "read_omikuji_points" on public.omikuji_points
  for select using (true);

-- 追加：誰でも可。ただし付与できるのは 100pt(大吉) / 200pt(凶) のみ・名前は1〜24文字
-- （値を固定することで不正な大量加算を防止）
create policy "insert_omikuji_points" on public.omikuji_points
  for insert with check (
    char_length(name) between 1 and 24
    and pts in (100, 200)
  );

-- 削除：運営（ログイン済）だけ（不正対策）
create policy "admin_delete_omikuji_points" on public.omikuji_points
  for delete to authenticated using (true);

-- 完了！
