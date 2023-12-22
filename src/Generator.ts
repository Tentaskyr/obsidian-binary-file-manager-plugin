import BinaryFileManagerPlugin from 'main';
import {
	App,
	normalizePath,
	TAbstractFile,
	TFile,
	moment,
	Notice,
	Plugin,
} from 'obsidian';
import { UncoveredApp } from 'Uncover';
import { retry } from 'Util';

const TEMPLATER_PLUGIN_NAME = 'templater-obsidian';
const DEFAULT_TEMPLATE_CONTENT = `![[{{PATH}}]]
LINK: [[{{PATH}}]]
CREATED At: {{CDATE:YYYY-MM-DD}}
FILE TYPE: {{EXTENSION:UP}}
`;

const RETRY_NUMBER = 1000;
const TIMEOUT_MILLISECOND = 1000;

export class MetaDataGenerator {
	private app: App;
	private plugin: BinaryFileManagerPlugin;

	constructor(app: App, plugin: BinaryFileManagerPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	async shouldCreateMetaDataFile(file: TAbstractFile): Promise<boolean> {
		if (!(file instanceof TFile)) {
			return false;
		}

		let filePath = file.path.toString();
		let folderPath = filePath.substring(0,filePath.lastIndexOf("/"));

		if (
			!(folderPath === (
				normalizePath(this.plugin.settings.binaryFilePath)
			))
		) {
			return false;
		}

		const matchedExtension =
			this.plugin.fileExtensionManager.getExtensionMatchedBest(file.name);
		if (!matchedExtension) {
			return false;
		}

		if (this.plugin.fileListAdapter.has(file.path)) {
			return false;
		}

		return true;
	}

	async create(file: TFile) {
		const metaDataFileName = this.uniquefyMetaDataFileName(
			this.generateMetaDataFileName(file)
		);
		const metaDataFilePath = `${this.plugin.settings.folder}/${metaDataFileName}`;
		const attachmentsFilePath = `${this.plugin.settings.attachmentsFilePath}`;

		await this.createMetaDataFile(metaDataFilePath, file as TFile, attachmentsFilePath);
	}

	private generateMetaDataFileName(file: TFile): string {
		const metaDataFileName = `${this.plugin.formatter.format(
			this.plugin.settings.filenameFormat,
			file.path,
			file.stat.ctime
		)}.md`;
		return metaDataFileName;
	}

	private uniquefyMetaDataFileName(metaDataFileName: string): string {
		const metaDataFilePath = normalizePath(
			`${this.plugin.settings.folder}/${metaDataFileName}`
		);
		if (this.app.vault.getAbstractFileByPath(metaDataFilePath)) {
			return `CONFLICT-${moment().format(
				'YYYY-MM-DD-hh-mm-ss'
			)}-${metaDataFileName}`;
		} else {
			return metaDataFileName;
		}
	}

	private async createMetaDataFile(
		metaDataFilePath: string,
		binaryFile: TFile,
		attachmentsFilePath: string
	): Promise<void> {
		const templateContent = await this.fetchTemplateContent();

		// process by Templater
		const templaterPlugin = await this.getTemplaterPlugin();
		const binaryFileName = binaryFile.basename+"."+binaryFile.extension;
		const moveToFullFilePath = attachmentsFilePath+"/"+binaryFileName;
		if (!(this.plugin.settings.useTemplater && templaterPlugin)) {
			this.app.vault.create(
				metaDataFilePath,
				this.plugin.formatter.format(
					templateContent,
					moveToFullFilePath,
					binaryFile.stat.ctime
				)
			);

			// move binary file into attachments folder
			try {
				await this.app.fileManager.renameFile(binaryFile, moveToFullFilePath);
			} catch (err) {
				alert(err);
			}

		} else {
			const targetFile = await this.app.vault.create(
				metaDataFilePath,
				''
			);

			try {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const content = await templaterPlugin.templater.parse_template(
					{ target_file: targetFile, run_mode: 4 },
					this.plugin.formatter.format(
						templateContent,
						binaryFile.path,
						binaryFile.stat.ctime
					)
				);
				this.app.vault.modify(targetFile, content);
			} catch (err) {
				new Notice(
					'ERROR in Binary File Manager Plugin: failed to connect to Templater. Your Templater version may not be supported'
				);
				console.log(err);
			}
		}
	}

	private async fetchTemplateContent(): Promise<string> {
		if (this.plugin.settings.templatePath === '') {
			return DEFAULT_TEMPLATE_CONTENT;
		}

		const templateFile = await retry(
			() => {
				return this.app.vault.getAbstractFileByPath(
					this.plugin.settings.templatePath
				);
			},
			TIMEOUT_MILLISECOND,
			RETRY_NUMBER,
			(abstractFile) => abstractFile !== null
		);

		if (!(templateFile instanceof TFile)) {
			const msg = `Template file ${this.plugin.settings.templatePath} is invalid`;
			console.log(msg);
			new Notice(msg);
			return DEFAULT_TEMPLATE_CONTENT;
		}
		return await this.app.vault.read(templateFile);
	}

	private async getTemplaterPlugin(): Promise<Plugin | undefined> {
		const app = this.app as UncoveredApp;
		return await retry(
			() => {
				return app.plugins.plugins[TEMPLATER_PLUGIN_NAME];
			},
			TIMEOUT_MILLISECOND,
			RETRY_NUMBER
		);
	}

	findUnlinkedBinaries(): TFile[] {
		const unlinkedBinaries: TFile[] = [];
		const linkedPaths = new Set<string>();

		// collect all link destinations
		Object.values(this.app.metadataCache.resolvedLinks).forEach((links) => {
			Object.keys(links).forEach((dest) => {
				linkedPaths.add(dest);
			});
		});

		// collect only unlinked binaries
		this.app.vault.getFiles().forEach((file) => {
			const isUnlinkedBinary =
				!linkedPaths.has(file.path) &&
				this.plugin.fileExtensionManager.verify(file.path);
			if (isUnlinkedBinary) {
				unlinkedBinaries.push(file);
			}
		});

		return unlinkedBinaries;
	}

	findLinkedBinaries(): TFile[] {
		const linkedBinaries: TFile[] = [];
		const linkedPaths = new Set<string>();

		// collect all link destinations
		Object.values(this.app.metadataCache.resolvedLinks).forEach((links) => {
			Object.keys(links).forEach((dest) => {
				linkedPaths.add(dest);
			});
		});

		// collect only unlinked binaries
		this.app.vault.getFiles().forEach((file) => {
			const isUnlinkedBinary =
				!linkedPaths.has(file.path) &&
				this.plugin.fileExtensionManager.verify(file.path);
			if (!isUnlinkedBinary) {
				linkedBinaries.push(file);
			}
		});

		return linkedBinaries;
	}
}
