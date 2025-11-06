import { createHash } from 'crypto';
import type { PalAIProvider, DiagnoseInput, DiagnoseOutput, Label, Severity } from '../types';

export class LocalMockProvider implements PalAIProvider {
  async diagnose(input: DiagnoseInput): Promise<DiagnoseOutput> {
    // Create deterministic hash from image buffer
    const hash = createHash('md5').update(input.imageBuffer).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);

    // Deterministic selection based on hash
    const labels: Label[] = [
      'HEALTHY',
      'BACTERIAL_LEAF_BLIGHT',
      'BROWN_SPOT',
      'SHEATH_BLIGHT',
      'TUNGRO',
      'BLAST',
    ];
    const severities: Severity[] = ['LOW', 'MODERATE', 'HIGH'];

    const labelIndex = hashNum % labels.length;
    const severityIndex = (hashNum >> 8) % severities.length;
    const confidence = ((hashNum % 1000) / 1000) * 0.3 + 0.7; // 0.7-1.0

    const label = labels[labelIndex];
    const severity = severities[severityIndex];
    const locale = input.promptExtras?.locale || 'en';

    const explanations: Record<Label, { en: string; tl: string }> = {
      HEALTHY: {
        en: 'The rice leaf appears healthy with no visible disease symptoms.',
        tl: 'Mukhang healthy ang dahon. Walang signs ng sakit.',
      },
      BACTERIAL_LEAF_BLIGHT: {
        en: 'Signs of bacterial leaf blight detected. Check water management and avoid overhead irrigation.',
        tl: 'May signs ng Bacterial Leaf Blight. I-check ang water management. Iwasan overhead irrigation.',
      },
      BROWN_SPOT: {
        en: 'Brown spot disease detected. Consider fungicide treatment if symptoms worsen.',
        tl: 'May Brown Spot. Kung lumalala, mag-consult sa agri technician para sa fungicide.',
      },
      SHEATH_BLIGHT: {
        en: 'Sheath blight symptoms present. Monitor closely and maintain proper spacing.',
        tl: 'May Sheath Blight. I-monitor closely. I-maintain proper spacing.',
      },
      TUNGRO: {
        en: 'Tungro virus detected. Remove infected plants and control insect vectors.',
        tl: 'May Tungro. I-remove ang infected plants. I-control ang insect vectors.',
      },
      BLAST: {
        en: 'Rice blast disease detected. Apply fungicide and improve field drainage.',
        tl: 'May signs ng Blast. Mag-apply ng fungicide. I-improve ang field drainage.',
      },
    };

    const explanation = explanations[label];

    // Treatment and prevention steps for each disease
    const treatmentData: Record<Label, {
      prevention: Array<{ step: number; titleEn: string; titleTl: string; descriptionEn: string; descriptionTl: string }>;
      treatment: Array<{ step: number; titleEn: string; titleTl: string; descriptionEn: string; descriptionTl: string }>;
      sources: Array<{ title: string; url: string }>;
    }> = {
      HEALTHY: {
        prevention: [],
        treatment: [],
        sources: [],
      },
      BACTERIAL_LEAF_BLIGHT: {
        prevention: [
          {
            step: 1,
            titleEn: 'Use Resistant Varieties',
            titleTl: 'Gumamit ng Resistant na Variety',
            descriptionEn: 'Plant rice varieties that are resistant to bacterial leaf blight.',
            descriptionTl: 'Magtanim ng variety na resistant sa bacterial leaf blight.',
          },
          {
            step: 2,
            titleEn: 'Balance Nitrogen Fertilizer',
            titleTl: 'I-balance ang Nitrogen Fertilizer',
            descriptionEn: 'Avoid excessive nitrogen fertilizer application, which makes plants more susceptible.',
            descriptionTl: 'Iwasan ang sobrang nitrogen fertilizer dahil mas magiging madaling mahawahan ang tanim.',
          },
          {
            step: 3,
            titleEn: 'Proper Water Management',
            titleTl: 'Tamang Water Management',
            descriptionEn: 'Maintain shallow water level and avoid prolonged flooding.',
            descriptionTl: 'Panatilihing mababaw ang tubig at iwasan ang matagal na baha.',
          },
        ],
        treatment: [
          {
            step: 1,
            titleEn: 'Remove Infected Leaves',
            titleTl: 'Alisin ang May Sakit na Dahon',
            descriptionEn: 'Cut and remove infected leaves to prevent spread.',
            descriptionTl: 'Putulin at alisin ang mga dahon na may sakit para hindi kumalat.',
          },
          {
            step: 2,
            titleEn: 'Apply Copper-based Bactericide',
            titleTl: 'Mag-apply ng Copper-based Bactericide',
            descriptionEn: 'Spray copper hydroxide or copper oxychloride at recommended rates.',
            descriptionTl: 'I-spray ang copper hydroxide o copper oxychloride ayon sa recommended dosage.',
          },
          {
            step: 3,
            titleEn: 'Improve Drainage',
            titleTl: 'Pagbutihin ang Drainage',
            descriptionEn: 'Ensure proper field drainage to reduce disease pressure.',
            descriptionTl: 'Siguraduhing maayos ang drainage ng palayan para mabawasan ang sakit.',
          },
        ],
        sources: [
          { title: 'IRRI - Bacterial Leaf Blight Management', url: 'http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/bacterial-blight' },
          { title: 'PhilRice Disease Management Guide', url: 'https://www.philrice.gov.ph' },
        ],
      },
      BROWN_SPOT: {
        prevention: [
          {
            step: 1,
            titleEn: 'Use Quality Seeds',
            titleTl: 'Gumamit ng Quality Seeds',
            descriptionEn: 'Use certified, disease-free seeds from reliable sources.',
            descriptionTl: 'Gumamit ng certified, walang sakit na binhi mula sa mapagkakatiwalaang source.',
          },
          {
            step: 2,
            titleEn: 'Balanced Fertilization',
            titleTl: 'Balanced na Fertilization',
            descriptionEn: 'Apply balanced NPK fertilizer and avoid potassium deficiency.',
            descriptionTl: 'Mag-apply ng balanced NPK fertilizer at iwasan ang kulang sa potassium.',
          },
          {
            step: 3,
            titleEn: 'Maintain Soil Health',
            titleTl: 'Pangalagaan ang Kalusugan ng Lupa',
            descriptionEn: 'Add organic matter to improve soil fertility and plant resistance.',
            descriptionTl: 'Magdagdag ng organic matter para gumanda ang lupa at tumaas ang resistance ng tanim.',
          },
        ],
        treatment: [
          {
            step: 1,
            titleEn: 'Apply Fungicide',
            titleTl: 'Mag-apply ng Fungicide',
            descriptionEn: 'Use mancozeb or copper-based fungicides at first sign of infection.',
            descriptionTl: 'Gumamit ng mancozeb o copper-based fungicide sa unang sign ng impeksyon.',
          },
          {
            step: 2,
            titleEn: 'Foliar Fertilization',
            titleTl: 'Foliar Fertilization',
            descriptionEn: 'Apply foliar fertilizer with potassium to strengthen plant resistance.',
            descriptionTl: 'Mag-apply ng foliar fertilizer na may potassium para lumakas ang tanim.',
          },
          {
            step: 3,
            titleEn: 'Monitor Regularly',
            titleTl: 'Regular na Pag-monitor',
            descriptionEn: 'Check plants weekly and reapply treatment if symptoms persist.',
            descriptionTl: 'I-check ang tanim weekly at ulit-ulitin ang treatment kung hindi nawala ang sintomas.',
          },
        ],
        sources: [
          { title: 'IRRI - Brown Spot Management', url: 'http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/brown-spot' },
          { title: 'Rice Knowledge Bank', url: 'http://www.knowledgebank.irri.org' },
        ],
      },
      SHEATH_BLIGHT: {
        prevention: [
          {
            step: 1,
            titleEn: 'Proper Plant Spacing',
            titleTl: 'Tamang Spacing ng Tanim',
            descriptionEn: 'Maintain adequate spacing between plants for good air circulation.',
            descriptionTl: 'Panatilihing sapat ang spacing ng mga tanim para sa magandang air circulation.',
          },
          {
            step: 2,
            titleEn: 'Avoid Excessive Nitrogen',
            titleTl: 'Iwasan ang Sobrang Nitrogen',
            descriptionEn: 'Do not over-apply nitrogen fertilizer which promotes disease.',
            descriptionTl: 'Huwag mag-sobra sa nitrogen fertilizer dahil nakakatulong ito sa pagkalat ng sakit.',
          },
          {
            step: 3,
            titleEn: 'Water Management',
            titleTl: 'Water Management',
            descriptionEn: 'Drain field periodically to reduce humidity.',
            descriptionTl: 'Paminsan-minsan, patuyin ang palayan para bumaba ang humidity.',
          },
        ],
        treatment: [
          {
            step: 1,
            titleEn: 'Apply Fungicide Early',
            titleTl: 'Mag-apply ng Fungicide Nang Maaga',
            descriptionEn: 'Apply azoxystrobin or validamycin at first symptoms.',
            descriptionTl: 'Mag-apply ng azoxystrobin o validamycin sa unang sintomas.',
          },
          {
            step: 2,
            titleEn: 'Remove Infected Tillers',
            titleTl: 'Alisin ang May Sakit na Tillers',
            descriptionEn: 'Cut and burn severely infected tillers to prevent spread.',
            descriptionTl: 'Putulin at sunugin ang mga tillers na malubhang may sakit para hindi kumalat.',
          },
          {
            step: 3,
            titleEn: 'Repeat Application',
            titleTl: 'Ulitin ang Application',
            descriptionEn: 'Reapply fungicide after 10-14 days if symptoms continue.',
            descriptionTl: 'Ulitin ang fungicide pagkatapos ng 10-14 days kung patuloy ang sintomas.',
          },
        ],
        sources: [
          { title: 'IRRI - Sheath Blight Management', url: 'http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/sheath-blight' },
          { title: 'Rice Production Manual', url: 'https://www.philrice.gov.ph' },
        ],
      },
      TUNGRO: {
        prevention: [
          {
            step: 1,
            titleEn: 'Plant Resistant Varieties',
            titleTl: 'Magtanim ng Resistant Varieties',
            descriptionEn: 'Use tungro-resistant rice varieties recommended by PhilRice.',
            descriptionTl: 'Gumamit ng tungro-resistant varieties na inirekomenda ng PhilRice.',
          },
          {
            step: 2,
            titleEn: 'Control Green Leafhoppers',
            titleTl: 'Kontrolin ang Green Leafhoppers',
            descriptionEn: 'Manage insect vectors that spread the virus.',
            descriptionTl: 'Kontrolin ang mga insect vectors na nagkakalat ng virus.',
          },
          {
            step: 3,
            titleEn: 'Synchronized Planting',
            titleTl: 'Sabay-sabay na Pagtatanim',
            descriptionEn: 'Plant with neighbors to break pest cycle.',
            descriptionTl: 'Magtanim kasabay ng kapitbahay para maputol ang pest cycle.',
          },
        ],
        treatment: [
          {
            step: 1,
            titleEn: 'Remove Infected Plants',
            titleTl: 'Alisin ang May Sakit na Tanim',
            descriptionEn: 'Immediately remove and destroy infected plants.',
            descriptionTl: 'Agad na alisin at sirain ang mga tanimng may tungro.',
          },
          {
            step: 2,
            titleEn: 'Control Insect Vectors',
            titleTl: 'Kontrolin ang Insect Vectors',
            descriptionEn: 'Apply insecticides to control green leafhoppers.',
            descriptionTl: 'Mag-apply ng insecticide para kontrolin ang green leafhoppers.',
          },
          {
            step: 3,
            titleEn: 'Monitor Field Regularly',
            titleTl: 'Regular na Pag-monitor',
            descriptionEn: 'Inspect field daily for new infections and vector presence.',
            descriptionTl: 'I-inspect ang palayan araw-araw para sa bagong impeksyon at presence ng vectors.',
          },
        ],
        sources: [
          { title: 'IRRI - Tungro Disease Management', url: 'http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/tungro' },
          { title: 'PhilRice Tungro Management', url: 'https://www.philrice.gov.ph' },
        ],
      },
      BLAST: {
        prevention: [
          {
            step: 1,
            titleEn: 'Use Resistant Varieties',
            titleTl: 'Gumamit ng Resistant Varieties',
            descriptionEn: 'Plant blast-resistant rice varieties suitable for your area.',
            descriptionTl: 'Magtanim ng blast-resistant varieties na angkop sa inyong lugar.',
          },
          {
            step: 2,
            titleEn: 'Avoid Excessive Nitrogen',
            titleTl: 'Iwasan ang Sobrang Nitrogen',
            descriptionEn: 'Use balanced fertilization; excess nitrogen increases susceptibility.',
            descriptionTl: 'Gumamit ng balanced fertilization; sobrang nitrogen ay nagpapahina sa tanim.',
          },
          {
            step: 3,
            titleEn: 'Manage Water Properly',
            titleTl: 'Tamang Pamamahala ng Tubig',
            descriptionEn: 'Avoid prolonged leaf wetness by managing irrigation timing.',
            descriptionTl: 'Iwasan ang matagal na basang dahon sa pamamagitan ng tamang oras ng irrigation.',
          },
        ],
        treatment: [
          {
            step: 1,
            titleEn: 'Apply Systemic Fungicide',
            titleTl: 'Mag-apply ng Systemic Fungicide',
            descriptionEn: 'Use tricyclazole or azoxystrobin immediately at first symptoms.',
            descriptionTl: 'Gumamit ng tricyclazole o azoxystrobin agad sa unang sintomas.',
          },
          {
            step: 2,
            titleEn: 'Improve Field Drainage',
            titleTl: 'Pagbutihin ang Drainage',
            descriptionEn: 'Ensure proper water drainage to reduce humidity and leaf wetness.',
            descriptionTl: 'Siguraduhing maayos ang drainage para mabawasan ang humidity at basa ng dahon.',
          },
          {
            step: 3,
            titleEn: 'Monitor and Reapply',
            titleTl: 'I-monitor at Ulitin',
            descriptionEn: 'Monitor disease progression and reapply fungicide every 7-10 days.',
            descriptionTl: 'I-monitor ang sakit at ulitin ang fungicide every 7-10 days.',
          },
        ],
        sources: [
          { title: 'IRRI - Blast Disease Management', url: 'http://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/blast-leaf-collar' },
          { title: 'Rice Blast Disease Guide', url: 'https://www.philrice.gov.ph' },
        ],
      },
    };

    const diseaseData = treatmentData[label];

    return {
      label,
      confidence,
      severity,
      explanationEn: explanation.en,
      explanationTl: explanation.tl,
      cautions: label !== 'HEALTHY' ? ['Monitor field conditions regularly', 'Consult local agricultural technician for severe cases'] : [],
      preventionSteps: diseaseData.prevention,
      treatmentSteps: diseaseData.treatment,
      sources: diseaseData.sources,
    };
  }
}

