import {
  renderNewsMarkdown,
  validateNewsCandidates,
  type ExistingNewsReference,
  type NewsCandidate,
  type RejectedNewsCandidate,
} from './news-discovery-policy.ts';

export interface NewsPullRequest {
  number: number;
  url: string;
  branch: string;
  headSha: string;
}

export interface RenderedNewsArticle {
  filename: string;
  content: string;
}

export interface NewsDiscoveryDependencies {
  assertCanPublish: () => Promise<void>;
  getExistingNews: () => Promise<ExistingNewsReference[]>;
  discover: (existingNews: readonly ExistingNewsReference[]) => Promise<unknown>;
  createPullRequest: (
    articles: readonly RenderedNewsArticle[],
    candidates: readonly NewsCandidate[],
  ) => Promise<NewsPullRequest>;
  sendNotification: (
    pullRequest: NewsPullRequest,
    candidates: readonly NewsCandidate[],
  ) => Promise<void>;
}

export interface NewsDiscoveryRunOptions {
  dryRun: boolean;
  today?: string;
  lookbackDays?: number;
}

export interface NewsDiscoveryRunResult {
  status: 'dry-run' | 'no-news' | 'notified';
  articles: NewsCandidate[];
  rejected: RejectedNewsCandidate[];
  pullRequest?: NewsPullRequest;
}

export async function runNewsDiscoveryWorkflow(
  options: NewsDiscoveryRunOptions,
  dependencies: NewsDiscoveryDependencies,
): Promise<NewsDiscoveryRunResult> {
  if (!options.dryRun) await dependencies.assertCanPublish();

  const existingNews = await dependencies.getExistingNews();
  const payload = await dependencies.discover(existingNews);
  const validation = validateNewsCandidates(payload, {
    existingNews,
    ...(options.today ? { today: options.today } : {}),
    ...(options.lookbackDays === undefined ? {} : { lookbackDays: options.lookbackDays }),
  });

  if (options.dryRun) {
    return {
      status: 'dry-run',
      articles: validation.accepted,
      rejected: validation.rejected,
    };
  }
  if (validation.accepted.length === 0) {
    return {
      status: 'no-news',
      articles: [],
      rejected: validation.rejected,
    };
  }

  const renderedArticles = validation.accepted.map(renderNewsMarkdown);
  const pullRequest = await dependencies.createPullRequest(renderedArticles, validation.accepted);
  try {
    await dependencies.sendNotification(pullRequest, validation.accepted);
  } catch {
    throw new Error(
      `PR #${pullRequest.number} quedó creada, pero el correo falló: ${pullRequest.url}`,
    );
  }

  return {
    status: 'notified',
    articles: validation.accepted,
    rejected: validation.rejected,
    pullRequest,
  };
}
