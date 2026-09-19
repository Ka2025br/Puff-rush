create table if not exists public.puff_ranking (
  player_id uuid primary key,
  nickname varchar(15) not null check (char_length(nickname) between 3 and 15),
  best_score integer not null default 0 check (best_score >= 0),
  updated_at timestamptz not null default now()
);

alter table public.puff_ranking enable row level security;

create or replace function public.upsert_puff_score(p_player_id uuid, p_nickname text, p_score integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  if char_length(trim(p_nickname)) < 3 or char_length(trim(p_nickname)) > 15 then raise exception 'nickname inválido'; end if;
  if p_score < 0 or p_score > 100000000 then raise exception 'score inválido'; end if;
  insert into puff_ranking(player_id,nickname,best_score,updated_at)
  values(p_player_id,trim(p_nickname),p_score,now())
  on conflict(player_id) do update set
    nickname=excluded.nickname,
    best_score=greatest(puff_ranking.best_score,excluded.best_score),
    updated_at=case when excluded.best_score>puff_ranking.best_score then now() else puff_ranking.updated_at end;
end $$;

create or replace function public.get_puff_rank(p_player_id uuid)
returns table(position bigint,best_score integer) language sql security definer set search_path=public as $$
  with ranked as (
    select player_id,best_score,row_number() over(order by best_score desc,updated_at asc) as position
    from puff_ranking
  ) select position,best_score from ranked where player_id=p_player_id;
$$;

grant execute on function public.upsert_puff_score(uuid,text,integer) to anon, authenticated;
grant execute on function public.get_puff_rank(uuid) to anon, authenticated;
grant select on public.puff_ranking to anon, authenticated;
create policy "public leaderboard read" on public.puff_ranking for select to anon,authenticated using (true);
