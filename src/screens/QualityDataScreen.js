import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    Image,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

// --- SAFE IMPORT FOR FILE SYSTEM (using legacy API) ---
let FileSystem;
try {
    FileSystem = require('expo-file-system/legacy');
} catch (e) {
    console.log("FileSystem is not available (running on Web or missing dependency)");
}

// --- LOADING SCREEN COMPONENT ---
const LoadingScreen = ({ colors }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [fadeAnim, scaleAnim, pulseAnim]);

    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.tealDark }]}>
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    alignItems: 'center',
                    transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
                }}
            >
                <Image
                    source={require('../../assets/quality_data.png')}
                    style={styles.logoImage}
                />
            </Animated.View>
            <Animated.View style={{ opacity: fadeAnim, marginTop: 30 }}>
                <ActivityIndicator size="large" color={colors.tealLight} />
                <Text style={[styles.loadingText, { color: colors.tealLight }]}>Loading Quality Data...</Text>
            </Animated.View>
        </View>
    );
};

// --- SUB-COMPONENTS (Theme-aware) ---
const InputRow = ({ label, value, onChange, colors }) => (
    <View style={{ marginBottom: 10 }}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <TextInput
            style={[styles.input, {
                backgroundColor: colors.bgTertiary,
                borderColor: colors.border,
                color: colors.textPrimary
            }]}
            value={value}
            onChangeText={onChange}
            placeholderTextColor={colors.textMuted}
        />
    </View>
);

const TwoColRow = ({ label1, val1, fn1, label2, val2, fn2, colors }) => (
    <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label1}</Text>
            <TextInput
                style={[styles.input, {
                    backgroundColor: colors.bgTertiary,
                    borderColor: colors.border,
                    color: colors.textPrimary
                }]}
                value={val1}
                onChangeText={fn1}
                placeholderTextColor={colors.textMuted}
            />
        </View>
        <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label2}</Text>
            <TextInput
                style={[styles.input, {
                    backgroundColor: colors.bgTertiary,
                    borderColor: colors.border,
                    color: colors.textPrimary
                }]}
                value={val2}
                onChangeText={fn2}
                placeholderTextColor={colors.textMuted}
            />
        </View>
    </View>
);

const QualityDataScreen = ({ onBack, onSave }) => {
    const { colors, theme } = useTheme();

    // --- 0. LOADING STATE ---
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // --- 1. DATA STATE ---
    const [companyName, setCompanyName] = useState('JP TRUSTEES LTD');
    const [truckDetails, setTruckDetails] = useState({
        truckNo: '',
        product: '',
        depot: '',
    });
    const [inspector, setInspector] = useState('');
    const [sealer, setSealer] = useState('');
    const [scannedImages, setScannedImages] = useState([]);
    const [inspectorSignature, setInspectorSignature] = useState(null);
    const [sealerSignature, setSealerSignature] = useState(null);
    const [currentSigner, setCurrentSigner] = useState(null);
    const [isSignatureModalVisible, setSignatureModalVisible] = useState(false);
    const [compartments, setCompartments] = useState([
        { id: 1, litres: '', cert: '', prod: '' },
        { id: 2, litres: '', cert: '', prod: '' },
        { id: 3, litres: '', cert: '', prod: '' },
        { id: 4, litres: '', cert: '', prod: '' },
        { id: 5, litres: '', cert: '', prod: '' },
        { id: 6, litres: '', cert: '', prod: '' },
    ]);
    const [quality, setQuality] = useState({
        density: '',
        diffComp: '',
        temp: '',
        additive: '',
        water: '',
        color: '',
    });
    const ref = useRef();

    // --- 2. UPDATE HELPERS ---
    const updateTruck = (field, value) =>
        setTruckDetails({ ...truckDetails, [field]: value });
    const updateCompartment = (index, field, value) => {
        const updated = [...compartments];
        updated[index][field] = value;
        setCompartments(updated);
    };
    const updateQuality = (field, value) =>
        setQuality({ ...quality, [field]: value });

    // --- 3. IMAGE & SCANNER LOGIC ---
    const handleAddDocument = () => {
        Alert.alert(
            'Add Document',
            'Choose a method to add your Waybill or Ticket:',
            [
                { text: 'Camera', onPress: pickFromCamera },
                { text: 'Gallery', onPress: pickFromGallery },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const pickFromCamera = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'Camera access is required.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [2480, 3508],
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled) {
            setScannedImages([...scannedImages, result.assets[0].base64]);
        }
    };

    const pickFromGallery = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'Gallery access is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [2480, 3508],
            quality: 0.8,
            base64: true,
        });
        if (!result.canceled) {
            setScannedImages([...scannedImages, result.assets[0].base64]);
        }
    };

    const removeImage = (indexToRemove) => {
        setScannedImages(
            scannedImages.filter((_, index) => index !== indexToRemove)
        );
    };

    // --- 4. SIGNATURE LOGIC ---
    const handleSignatureOK = (sig) => {
        if (currentSigner === 'inspector') {
            setInspectorSignature(sig);
        } else if (currentSigner === 'sealer') {
            setSealerSignature(sig);
        }
        setSignatureModalVisible(false);
        setCurrentSigner(null);
    };

    const handleClear = () => {
        ref.current.clearSignature();
    };

    // --- 5. PDF GENERATOR (PDF always uses light theme for printing) ---
    const getThemeColor = () => {
        if (companyName === 'MOREFUEL LTD') {
            return '#E31E24';
        } else if (companyName === 'JP TRUSTEES LTD') {
            return '#7CB342';
        }
        return '#ED7D31';
    };

    const generateHTML = () => {
        const themeColor = getThemeColor();
        const headerTitle = `QUALITY DATA - ${companyName.toUpperCase()}`;
        const randomNum = Math.floor(Math.random() * 99999) + 1;
        const invoiceNumber = String(randomNum).padStart(5, '0');

        const imagesHTML = scannedImages.map((img, index) => `
      <div class="page image-page">
        <div class="attachment-header">ATTACHMENT ${index + 1}</div>
        <div class="image-wrapper">
           <img src="data:image/jpeg;base64,${img}" />
        </div>
      </div>
    `).join('');

        const inspectorSigImg = inspectorSignature
            ? `<img src="${inspectorSignature}" style="height: 50px; width: auto;" />`
            : `<span style="color: #999; font-style: italic;">(Not Signed)</span>`;
        const sealerSigImg = sealerSignature
            ? `<img src="${sealerSignature}" style="height: 50px; width: auto;" />`
            : `<span style="color: #999; font-style: italic;">(Not Signed)</span>`;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; box-sizing: border-box; }
          .page:last-child { page-break-after: auto; }
          .image-page { display: flex; justify-content: center; align-items: center; background-color: #fff; padding: 20px; }
          .image-wrapper { width: 100%; height: 90%; display: flex; justify-content: center; align-items: center; }
          .image-wrapper img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .attachment-header { position: absolute; top: 20px; left: 20px; background: ${themeColor}; color: white; padding: 5px 15px; border-radius: 4px; font-size: 14px; z-index: 10; font-weight: bold; }
          .data-page { padding: 40px; }
          .header { border-bottom: 3px solid ${themeColor}; padding-bottom: 10px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header-title { font-size: 28px; font-weight: bold; color: ${themeColor}; text-transform: uppercase; }
          .header-meta { text-align: right; font-size: 12px; color: #666; }
          .section-title { background-color: ${themeColor}; color: white; padding: 8px 15px; font-size: 16px; font-weight: bold; border-radius: 4px; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px; }
          th { background-color: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; }
          td { border: 1px solid #ddd; padding: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .col { flex: 1; margin-right: 15px; }
          .col:last-child { margin-right: 0; }
          .key-value-box { background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 5px; }
          .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { font-size: 14px; font-weight: bold; color: #000; margin-top: 3px; }
          .footer-box { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fcfcfc; page-break-inside: avoid; }
          .sig-block { margin-top: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; min-height: 40px; }
        </style>
      </head>
      <body>
        ${imagesHTML}
        <div class="page data-page">
          <div class="header">
            <div class="header-title">${headerTitle}</div>
            <div class="header-meta">
              <span style="font-size: 12px; font-weight: bold; color: #000; display: block; margin-bottom: 2px;">INVOICE #: ${invoiceNumber}</span>
              Generated: ${new Date().toLocaleDateString()}<br/>Status: Final
            </div>
          </div>
          <div class="section-title">Truck Information</div>
          <div class="row">
            <div class="col key-value-box"><div class="label">Truck Number</div><div class="value">${truckDetails.truckNo || '-'}</div></div>
            <div class="col key-value-box"><div class="label">Product</div><div class="value">${truckDetails.product || '-'}</div></div>
            <div class="col key-value-box"><div class="label">Depot</div><div class="value">${truckDetails.depot || '-'}</div></div>
          </div>
          <div class="section-title">Compartment Levels</div>
          <table>
            <thead><tr><th style="width: 10%">Number</th><th>Litres</th><th>Certificate Level</th><th>Product Level</th></tr></thead>
            <tbody>${compartments.map((comp) => `<tr><td style="text-align: center; font-weight: bold;">${comp.id}</td><td>${comp.litres || '-'}</td><td>${comp.cert || '-'}</td><td>${comp.prod || '-'}</td></tr>`).join('')}</tbody>
          </table>
          <div class="section-title">Product Quality Parameters</div>
          <div class="row">
            <div class="col">
              <div class="key-value-box"><div class="label">Density</div><div class="value">${quality.density || '-'} kg/m³</div></div>
              <div class="key-value-box"><div class="label">Temperature</div><div class="value">${quality.temp || '-'} °C</div></div>
              <div class="key-value-box"><div class="label">Water Status</div><div class="value">${quality.water || '-'}</div></div>
            </div>
            <div class="col">
              <div class="key-value-box"><div class="label">Diff Comp Level</div><div class="value">${quality.diffComp || '-'} Lts</div></div>
              <div class="key-value-box"><div class="label">Additive</div><div class="value">${quality.additive || '-'} Lts</div></div>
              <div class="key-value-box"><div class="label">Product Color</div><div class="value">${quality.color || '-'}</div></div>
            </div>
          </div>
          <div class="footer-box">
            <div class="section-title" style="margin-top: 0; font-size: 14px;">Authorization</div>
            <div class="row">
              <div class="col"><div class="label">Inspector Name</div><div class="value">${inspector || '_________________'}</div><div style="margin-top: 15px;" class="label">Inspector Signature</div><div class="sig-block">${inspectorSigImg}</div></div>
              <div class="col"><div class="label">Sealer Name</div><div class="value">${sealer || '_________________'}</div><div style="margin-top: 15px;" class="label">Sealer Signature</div><div class="sig-block">${sealerSigImg}</div></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    const printPDF = async () => {
        try {
            const { uri } = await Print.printToFileAsync({
                html: generateHTML(),
                base64: false,
            });
            if (FileSystem && FileSystem.moveAsync) {
                const sanitize = (text) => text.replace(/[^a-zA-Z0-9-_]/g, '-');
                const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
                const fileName = `${sanitize(truckDetails.truckNo || 'TRUCK')}_${sanitize(truckDetails.depot || 'DEPOT')}_${sanitize(truckDetails.product || 'PRODUCT')}_${dateStr}.pdf`;
                const newPath = FileSystem.documentDirectory + fileName;
                await FileSystem.moveAsync({ from: uri, to: newPath });
                await shareAsync(newPath, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                if (Platform.OS === 'web') {
                    Alert.alert("Note", "Custom filename is not supported on Web.");
                }
                await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }

            // Save to database after successful PDF generation
            if (onSave) {
                await onSave({
                    companyName,
                    truckNo: truckDetails.truckNo,
                    product: truckDetails.product,
                    depot: truckDetails.depot,
                    compartments,
                    quality,
                    inspectorName: inspector,
                    sealerName: sealer,
                    inspectorSignature,
                    sealerSignature,
                });
            }
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    if (isLoading) {
        return <LoadingScreen colors={colors} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            {/* HEADER */}
            <View style={[styles.navBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <ArrowLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.textPrimary }]}>QUALITY DATA</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* SECTION 0: COMPANY INFORMATION */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        0. Company Information
                    </Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                        Select or Type Company Name for PDF Header
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="Enter Company Name"
                        placeholderTextColor={colors.textMuted}
                    />
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <TouchableOpacity
                            style={[styles.chip, { borderColor: colors.tealMid }, companyName === 'JP TRUSTEES LTD' && { backgroundColor: colors.tealMid }]}
                            onPress={() => setCompanyName('JP TRUSTEES LTD')}
                        >
                            <Text style={[styles.chipText, { color: colors.tealMid }, companyName === 'JP TRUSTEES LTD' && { color: '#fff' }]}>
                                JP TRUSTEES LTD
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.chip, { borderColor: colors.tealMid }, companyName === 'MOREFUEL LTD' && { backgroundColor: colors.tealMid }]}
                            onPress={() => setCompanyName('MOREFUEL LTD')}
                        >
                            <Text style={[styles.chipText, { color: colors.tealMid }, companyName === 'MOREFUEL LTD' && { color: '#fff' }]}>
                                MOREFUEL LTD
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SECTION 1: DOCUMENTS */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        1. Documentation
                    </Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                        Scan Waybills or Tickets (Will appear on Page 1, 2... of PDF)
                    </Text>
                    <TouchableOpacity
                        style={[styles.scanBtn, { backgroundColor: `${colors.blue}15`, borderColor: colors.blue }]}
                        onPress={handleAddDocument}
                    >
                        <Text style={[styles.scanBtnText, { color: colors.blue }]}>+ Add Document</Text>
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        {scannedImages.map((img, index) => (
                            <View key={index} style={styles.thumbContainer}>
                                <Image source={{ uri: `data:image/jpeg;base64,${img}` }} style={[styles.thumbnail, { borderColor: colors.border }]} />
                                <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(index)}>
                                    <Text style={styles.removeText}>X</Text>
                                </TouchableOpacity>
                                <Text style={[styles.thumbLabel, { color: colors.textSecondary }]}>Doc {index + 1}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* SECTION 2: TRUCK DETAILS */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        2. Truck Details
                    </Text>
                    <InputRow label="Truck No" value={truckDetails.truckNo} onChange={(v) => updateTruck('truckNo', v)} colors={colors} />
                    <InputRow label="Product" value={truckDetails.product} onChange={(v) => updateTruck('product', v)} colors={colors} />
                    <InputRow label="Depot" value={truckDetails.depot} onChange={(v) => updateTruck('depot', v)} colors={colors} />
                </View>

                {/* SECTION 3: COMPARTMENTS */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        3. Compartment Levels
                    </Text>
                    <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                        <Text style={[styles.th, { flex: 0.5, color: colors.textSecondary }]}>No.</Text>
                        <Text style={[styles.th, { flex: 1, color: colors.textSecondary }]}>Litres</Text>
                        <Text style={[styles.th, { flex: 1, color: colors.textSecondary }]}>Cert</Text>
                        <Text style={[styles.th, { flex: 1, color: colors.textSecondary }]}>Prod</Text>
                    </View>
                    {compartments.map((comp, index) => (
                        <View key={comp.id} style={styles.tableRow}>
                            <Text style={{ flex: 0.5, fontWeight: 'bold', textAlign: 'center', color: colors.textPrimary }}>{comp.id}</Text>
                            <TextInput style={[styles.tableInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]} value={comp.litres} keyboardType="numeric" onChangeText={(v) => updateCompartment(index, 'litres', v)} placeholderTextColor={colors.textMuted} />
                            <TextInput style={[styles.tableInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]} value={comp.cert} keyboardType="numeric" onChangeText={(v) => updateCompartment(index, 'cert', v)} placeholderTextColor={colors.textMuted} />
                            <TextInput style={[styles.tableInput, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]} value={comp.prod} keyboardType="numeric" onChangeText={(v) => updateCompartment(index, 'prod', v)} placeholderTextColor={colors.textMuted} />
                        </View>
                    ))}
                </View>

                {/* SECTION 4: QUALITY */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        4. Quality Parameters
                    </Text>
                    <TwoColRow label1="Density" val1={quality.density} fn1={(v) => updateQuality('density', v)} label2="Diff Comp Lvl" val2={quality.diffComp} fn2={(v) => updateQuality('diffComp', v)} colors={colors} />
                    <TwoColRow label1="Temperature" val1={quality.temp} fn1={(v) => updateQuality('temp', v)} label2="Additive" val2={quality.additive} fn2={(v) => updateQuality('additive', v)} colors={colors} />
                    <TwoColRow label1="Water Status" val1={quality.water} fn1={(v) => updateQuality('water', v)} label2="Product Color" val2={quality.color} fn2={(v) => updateQuality('color', v)} colors={colors} />
                </View>

                {/* SECTION 5: SIGN-OFF */}
                <View style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, borderBottomColor: colors.border }]}>
                        5. Sign-Off
                    </Text>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Inspector Name:</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]} value={inspector} onChangeText={setInspector} placeholderTextColor={colors.textMuted} />
                    <Text style={[styles.label, { marginTop: 10, color: colors.textSecondary }]}>Inspector Signature:</Text>
                    <TouchableOpacity style={[styles.signatureBox, { borderColor: colors.border }]} onPress={() => { setCurrentSigner('inspector'); setSignatureModalVisible(true); }}>
                        {inspectorSignature ? (
                            <Image source={{ uri: inspectorSignature }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                        ) : (
                            <Text style={{ color: colors.textMuted }}>Tap to Sign (Inspector)</Text>
                        )}
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Sealer's Name:</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]} value={sealer} onChangeText={setSealer} placeholderTextColor={colors.textMuted} />
                    <Text style={[styles.label, { marginTop: 10, color: colors.textSecondary }]}>Sealer Signature:</Text>
                    <TouchableOpacity style={[styles.signatureBox, { borderColor: colors.border }]} onPress={() => { setCurrentSigner('sealer'); setSignatureModalVisible(true); }}>
                        {sealerSignature ? (
                            <Image source={{ uri: sealerSignature }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                        ) : (
                            <Text style={{ color: colors.textMuted }}>Tap to Sign (Sealer)</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.printBtn, { backgroundColor: colors.tealMid }]} onPress={printPDF}>
                    <Text style={styles.printBtnText}>GENERATE PDF</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* SIGNATURE MODAL */}
            <Modal visible={isSignatureModalVisible} animationType="slide">
                <View style={[styles.modalContainer, { backgroundColor: colors.bgPrimary }]}>
                    <View style={[styles.navBar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
                        <View style={{ width: 40 }} />
                        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>
                            Sign Below ({currentSigner === 'inspector' ? 'Inspector' : 'Sealer'})
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                        <SignatureScreen ref={ref} onOK={handleSignatureOK} webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`} />
                    </View>
                    <View style={[styles.modalBtnRow, { backgroundColor: colors.bgSecondary }]}>
                        <TouchableOpacity onPress={handleClear} style={[styles.modalBtn, { backgroundColor: colors.red }]}>
                            <Text style={styles.modalBtnText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSignatureModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.textMuted }]}>
                            <Text style={styles.modalBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => ref.current.readSignature()} style={[styles.modalBtn, { backgroundColor: colors.green }]}>
                            <Text style={styles.modalBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logoImage: { width: 200, height: 200, resizeMode: 'contain', tintColor: 'white' },
    loadingText: { color: 'white', marginTop: 15, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 15,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 15 },
    card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, borderBottomWidth: 1, paddingBottom: 5 },
    subText: { fontSize: 12, marginBottom: 10 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 5, marginBottom: 5 },
    th: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
    tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    tableInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, marginHorizontal: 2, textAlign: 'center' },
    scanBtn: { padding: 12, borderRadius: 8, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, marginBottom: 10 },
    scanBtnText: { fontWeight: 'bold' },
    thumbContainer: { marginRight: 15, alignItems: 'center' },
    thumbnail: { width: 80, height: 100, borderRadius: 8, borderWidth: 1, resizeMode: 'cover' },
    removeBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#dc2626', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
    removeText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    thumbLabel: { fontSize: 10, marginTop: 2 },
    signatureBox: { height: 80, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
    modalContainer: { flex: 1 },
    modalBtnRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, paddingBottom: 40 },
    modalBtn: { padding: 12, borderRadius: 8, width: '30%', alignItems: 'center' },
    modalBtnText: { color: 'white', fontWeight: 'bold' },
    printBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
    printBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 10 },
    chipText: { fontSize: 12, fontWeight: 'bold' },
});

export default QualityDataScreen;
