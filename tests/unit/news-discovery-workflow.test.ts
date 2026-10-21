import { describe, expect, it, vi } from 'vitest';
import {
  runNewsDiscoveryWorkflow,
  type NewsDiscoveryDependencies,
} from '../../scripts/news-discovery-workflow.ts';

const candidate = {
  type: 'news',
  title: 'Palomares mejora el acceso al consultorio',
  description: 'El municipio ha iniciado trabajos para mejorar el acceso al consultorio local.',
  date: '2026-10-18',
  sourceName: 'Voces de Cuenca',
  sourceUrl: 'https://vocesdecuenca.com/provincia/palomares-consultorio',
  category: 'Municipio y servicios',
  localRelevance: 'La mejora afecta directamente a los vecinos de Palomares del Campo.',
  bodyMarkdown:
    'El municipio ha iniciado trabajos para mejorar el acceso al consultorio de Palomares del Campo.\n\nLa actuación afecta directamente a los vecinos y se basa en la información publicada por la fuente local. No se añaden medidas ni fechas que no aparezcan en esa información.',
};

const dependencies = () => ({
  assertCanPublish: vi.fn<NewsDiscoveryDependencies['assertCanPublish']>(async () => undefined),
  getExistingNews: vi.fn<NewsDiscoveryDependencies['getExistingNews']>(async () => []),
  discover: vi.fn<NewsDiscoveryDependencies['discover']>(async () => ({ candidates: [candidate] })),
  createPullRequest: vi.fn<NewsDiscoveryDependencies['createPullRequest']>(async () => ({
    number: 42,
    url: 'https://github.com/ralph1985/palomares-del-campo/pull/42',
    branch: 'automation/news-discovery-2026-10-20',
    headSha: 'a'.repeat(40),
  })),
  sendNotification: vi.fn<NewsDiscoveryDependencies['sendNotification']>(async () => undefined),
});

describe('news discovery workflow', () => {
  it('keeps dry runs read-only while showing validated proposals', async () => {
    const deps = dependencies();

    const result = await runNewsDiscoveryWorkflow({ dryRun: true, today: '2026-10-20' }, deps);

    expect(result.status).toBe('dry-run');
    expect(result.articles).toHaveLength(1);
    expect(deps.assertCanPublish).not.toHaveBeenCalled();
    expect(deps.createPullRequest).not.toHaveBeenCalled();
    expect(deps.sendNotification).not.toHaveBeenCalled();
  });

  it('does not create a PR or send email when no valid news is found', async () => {
    const deps = dependencies();
    deps.discover.mockResolvedValue({ candidates: [] });

    const result = await runNewsDiscoveryWorkflow({ dryRun: false, today: '2026-10-20' }, deps);

    expect(result.status).toBe('no-news');
    expect(deps.createPullRequest).not.toHaveBeenCalled();
    expect(deps.sendNotification).not.toHaveBeenCalled();
  });

  it('creates a review PR and then sends a notification containing its verified URL', async () => {
    const deps = dependencies();
    const order: string[] = [];
    deps.createPullRequest.mockImplementation(async () => {
      order.push('pr');
      return {
        number: 42,
        url: 'https://github.com/ralph1985/palomares-del-campo/pull/42',
        branch: 'automation/news-discovery-2026-10-20',
        headSha: 'b'.repeat(40),
      };
    });
    deps.sendNotification.mockImplementation(async (pullRequest) => {
      order.push('email');
      expect(pullRequest.url).toBe('https://github.com/ralph1985/palomares-del-campo/pull/42');
    });

    const result = await runNewsDiscoveryWorkflow({ dryRun: false, today: '2026-10-20' }, deps);

    expect(result.status).toBe('notified');
    expect(order).toEqual(['pr', 'email']);
    expect(deps.assertCanPublish).toHaveBeenCalledOnce();
  });

  it('reports the created PR URL if the SMTP notification fails', async () => {
    const deps = dependencies();
    deps.sendNotification.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(
      runNewsDiscoveryWorkflow({ dryRun: false, today: '2026-10-20' }, deps),
    ).rejects.toThrow(
      'PR #42 quedó creada, pero el correo falló: https://github.com/ralph1985/palomares-del-campo/pull/42',
    );
  });
});
