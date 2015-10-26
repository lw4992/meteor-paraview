/// <reference path='../../../../../.typescript/package_defs/all-definitions.d.ts'/>
/// <reference path='../../../../.typescript/custom_defs/all-custom-definitions.d.ts'/>
/// <reference path='../../layouts/two_col_layout.ts'/>

Template['paraviewScalarbar']['helpers']({
    displayScalarBar: function() {
        return PV.scalarBar.get().display;
    },
    scalarBarTitle: function() {
        return PV.scalarBar.get().title;
    },
    areDiscreteValues: function() {
        return PV.scalarBar.get().areDiscreteValues;
    },
    labelsAndColors: function() {
        return PV.scalarBar.get().labelsAndColors;
    },
    numLabels: function() {
        return PV.scalarBar.get().labelsAndColors.length;
    },
    colorBoxHeight: function() {
        if (this.areDiscreteValues) {
            var numLabels = PV.scalarBar.get().labelsAndColors.length;
            return numLabels * 50 - 46;
        } else {
            var numLabels = PV.scalarBar.get().labelsAndColors.length;
            return numLabels * 50 - 46;
        }
    },
    gradientValue: function() {
        var colorText = '';
        var labelsAndColors = PV.scalarBar.get().labelsAndColors;
        labelsAndColors.forEach(function(labelColor, index) {
            colorText += labelColor.color;
            if (index != labelsAndColors.length - 1) colorText += ',';
        });
        //console.log(colorText);
        var gradientValueText = "linear-gradient(" + colorText + ")";
        return gradientValueText;
    }
});