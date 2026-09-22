-- ============================================================
--  X(Twitter) アカウントを @Emachi_moe に更新する SQL
--  Supabase ダッシュボード → SQL Editor に貼り付けて [Run]
--
--  ※ なぜ必要か
--     サイトは起動時に profile.message（JSON）を読み、その中の
--     twitter_url で index.html のリンクを上書きします。
--     index.html / app.js の既定値を直しても、DBに古いURLが
--     残っているとそちらが優先されて古いまま表示されます。
--
--  ※ SQLを使わない方法
--     サイト右下の 🔑 で運営ログイン → 「✎ プロフィールを編集」
--     → 「X(Twitter) URL」を https://x.com/Emachi_moe に書き換えて保存。
--     こちらでも同じ結果になります。
-- ============================================================

update public.profile
set
  -- 実データ（JSONブロブ）側を更新。他の項目は触らない
  message = (
    coalesce(nullif(message, '')::jsonb, '{}'::jsonb)
    || jsonb_build_object('twitter_url', 'https://x.com/Emachi_moe')
  )::text,
  -- 旧スキーマの列も念のため揃えておく
  twitter_url = 'https://x.com/Emachi_moe',
  updated_at  = now()
where id = 1;

-- 確認用：実行後にこれを流すと、今入っている値が見られます
-- select message::jsonb ->> 'twitter_url' as twitter_url from public.profile where id = 1;
