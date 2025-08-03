import { FileManager } from '../../core/src/file-manager';
import { DockerManager } from './docker-manager';
import { GitManager } from './git-manager';

export interface LiveDeploymentConfig {
  appId: string;
  deploymentUrl: string;
  gitRepository: string;
  branch: string;
}

export interface CodeChange {
  filePath: string;
  newCode: string;
  changeType: 'modify' | 'create' | 'delete';
}

export class LiveDeploymentService {
  private fileManager: FileManager;
  private dockerManager: DockerManager;
  private gitManager: GitManager;

  constructor() {
    this.fileManager = new FileManager();
    this.dockerManager = new DockerManager();
    this.gitManager = new GitManager();
  }

  async applyLiveChanges(appId: string, changes: CodeChange[]): Promise<boolean> {
    try {
      console.log(`Applying live changes to app ${appId}...`);

      // 1. Apply code changes to local files
      await this.applyCodeChanges(appId, changes);

      // 2. Commit changes to git
      const commitMessage = this.generateCommitMessage(changes);
      await this.gitManager.commitChanges(appId, commitMessage);

      // 3. Push to deployment branch
      await this.gitManager.pushChanges(appId);

      // 4. Trigger live deployment
      await this.triggerLiveDeployment(appId);

      // 5. Wait for deployment to complete
      await this.waitForDeployment(appId);

      console.log(`Live changes applied successfully to app ${appId}`);
      return true;

    } catch (error) {
      console.error(`Failed to apply live changes to app ${appId}:`, error);
      return false;
    }
  }

  async createPreviewDeployment(appId: string, changes: CodeChange[]): Promise<string> {
    try {
      // Create a preview branch
      const previewBranch = `preview-${appId}-${Date.now()}`;
      
      // Apply changes to preview branch
      await this.applyCodeChanges(appId, changes, previewBranch);
      
      // Deploy preview
      const previewUrl = await this.deployPreview(appId, previewBranch);
      
      return previewUrl;

    } catch (error) {
      console.error(`Failed to create preview deployment:`, error);
      throw error;
    }
  }

  private async applyCodeChanges(appId: string, changes: CodeChange[], branch?: string): Promise<void> {
    for (const change of changes) {
      const fullPath = `apps/${appId}/${change.filePath}`;
      
      switch (change.changeType) {
        case 'modify':
        case 'create':
          await this.fileManager.writeFile(fullPath, change.newCode);
          break;
        case 'delete':
          await this.fileManager.deleteFile(fullPath);
          break;
      }
    }
  }

  private async triggerLiveDeployment(appId: string): Promise<void> {
    // This would trigger your deployment pipeline
    // Could be Vercel, Netlify, AWS, etc.
    
    const deploymentConfig = await this.getDeploymentConfig(appId);
    
    if (deploymentConfig.deploymentUrl.includes('vercel')) {
      await this.triggerVercelDeployment(appId);
    } else if (deploymentConfig.deploymentUrl.includes('netlify')) {
      await this.triggerNetlifyDeployment(appId);
    } else {
      await this.triggerCustomDeployment(appId);
    }
  }

  private async triggerVercelDeployment(appId: string): Promise<void> {
    // Trigger Vercel deployment via API
    const response = await fetch(`https://api.vercel.com/v1/integrations/deploy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: appId,
        gitSource: {
          type: 'github',
          repo: `${process.env.GITHUB_USERNAME}/Opsai`,
          ref: 'main'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Vercel deployment failed: ${response.statusText}`);
    }
  }

  private async triggerNetlifyDeployment(appId: string): Promise<void> {
    // Trigger Netlify deployment via API
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${appId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Netlify deployment failed: ${response.statusText}`);
    }
  }

  private async triggerCustomDeployment(appId: string): Promise<void> {
    // Custom deployment logic (Docker, Kubernetes, etc.)
    await this.dockerManager.rebuildAndDeploy(appId);
  }

  private async waitForDeployment(appId: string): Promise<void> {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const isDeployed = await this.checkDeploymentStatus(appId);
      
      if (isDeployed) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }

    throw new Error(`Deployment timeout for app ${appId}`);
  }

  private async checkDeploymentStatus(appId: string): Promise<boolean> {
    try {
      const deploymentConfig = await this.getDeploymentConfig(appId);
      const response = await fetch(`${deploymentConfig.deploymentUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private generateCommitMessage(changes: CodeChange[]): string {
    const changeTypes = changes.map(c => c.changeType);
    const files = changes.map(c => c.filePath.split('/').pop());
    
    return `Live update: ${changeTypes.join(', ')} ${files.join(', ')}`;
  }

  private async getDeploymentConfig(appId: string): Promise<LiveDeploymentConfig> {
    // This would load from your database or config file
    return {
      appId,
      deploymentUrl: `https://${appId}.vercel.app`,
      gitRepository: 'https://github.com/ToFut/Opsai',
      branch: 'main'
    };
  }
} 